/**
 * The viewport utility handles window events and returns an object with the
 * current viewport height, width, scroll top, scoll bottom, scroll total and
 * scroll distance.
 *
 * @author Chris Lock
 *
 * @param {object} dispatcher Dispatcher utility.
 * @return {object} Public methods.
 */
define(['dispatcher'], function(dispatcher) {
		/** @constant Scroll to speed. */
	var SCROLL_TO_SPEED = 500;

		/** @type {int} The object of curretn viewport projects. */
	var currentViewport = {
			width: 0,
			height: 0,
			scrollStart: 0,
			scrollDistance: 0,
			scrollTop: 0,
			scrollBottom: 0,
			scrollMax: 0
		},
		/** @type {bool} Is requestAnimationFrame supported. */
		requestAnimationFrameIsSupported = false,
		/** @type {int} The id for the request animaiton frame for scroll. */
		animationFrameIdScroll = null,
		/** @type {bool} Have we requested a animation frame for scroll. */
		hasRequestedAnimationFrameScroll = false,
		/** @type {int} The id for the request animaiton frame for resize. */
		animationFrameIdResize = null,
		/** @type {bool} Have we requested a animation frame for resize. */
		hasRequestedAnimationFrameResize = false,
		/** @type {bool} Should we fire window scroll events. */
		isScrolling = true,
		/** @type {int} The timer used to detect scroll stop. */
		scrollTimer = setTimeout(function() {}),
		/** @type {int} The number of milliseconds of inactivity considered a scroll stop. */
		scrollTimerLatency = 300,
		/** @type {int} The maxixmum distance the window can scroll. */
		windowTop = 0,
		/** @type {object} Callback queue for each event. */
		callbacks = {
			scroll: [],
			scrollUp: [],
			scrollDown: [],
			resize: []
		},
		/** @type {object} Set scrollTop values for different namespaces. */
		scrollTop = {
			top: 0
		},
		/** @type {object} The end position for resetScrollTop. */
		resetScrollTopEnd = 0,
		/** @type {int} The current document height. */
		documentHeight = 0,
		/** @type {int} The id for timeout used in scrollTo. */
		timeoutIdScrollTo = null,
		/** @type {int} The id for request animaiton frame used in scrollTo. */
		animationFrameIdScrollTo = null;

	/**
	 * Binds window resize and scroll.
	 *
	 * @return {void}
	 */
	function load() {
		updateRequestAnimationFrame();
		updateGetWindowDimensions();
		updateGetDocumentScrollTop()
		updateGetDocumentHeight();

		updateCurrentViewport();
		window.onscroll = handleScrollOptimized;
		window.onresize = handleResizeOptimized;
		watchHtmlResize();
	}
	/**
	 * Adds support for requestAnimationFrame for older browsers. If we can't
	 * add it, then make it a warpper to simply fire the callback.
	 *
	 * @return {void}
	 */
	function updateRequestAnimationFrame() {
		var vendors = [
				'webkit',
				'moz',
				'o',
				'ms'
			];

		for(var i = vendors.length - 1; i > -1 && !window.requestAnimationFrame; i--) {
			window.requestAnimationFrame = window[vendors[i]+'RequestAnimationFrame'];
			window.cancelAnimationFrame =
				window[vendors[i]+'CancelAnimationFrame'] ||
				window[vendors[i]+'CancelRequestAnimationFrame'];
		}

		if (!window.requestAnimationFrame)
			window.requestAnimationFrame = function(callback) {
				callback();
			};
		else
			requestAnimationFrameIsSupported = true;

		if (!window.cancelAnimationFrame)
			window.cancelAnimationFrame = function() {};
	}
	/**
	 * Gets the window width. Set as an empty function to be optimized later.
	 *
	 * @return {int} The window width.
	 */
	function getWindowWidth() {
		return 0;
	}
	/**
	 * Gets the window height. Set as an empty function to be optimized later.
	 *
	 * @return {int} The window height.
	 */
	function getWindowHeight() {
		return 0;
	}
	/**
	 * Rather than run a polyfill inside getWindowWidth and getWindowHeight
	 * every time it's called, let's optimize it to just return the right
	 * property.
	 *
	 * @return {void}
	 */
	function updateGetWindowDimensions() {
		if (window.innerHeight) {
			getWindowWidth = function() {
				return window.innerWidth;
			};
			getWindowHeight = function() {
				return window.innerHeight;
			};
		} else if (document.documentElement.clientHeight) {
			getWindowWidth = function() {
				return document.documentElement.clientWidth;
			};
			getWindowHeight = function() {
				return document.documentElement.clientHeight;
			};
		} else if (document.body.clientHeight) {
			getWindowWidth = function() {
				return document.body.clientWidth;
			};
			getWindowHeight = function() {
				return document.body.clientHeight;
			};
		}
	}
	/**
	 * Gets the document scroll top. Set as an empty function to be optimized
	 * later.
	 *
	 * @return {int} The document scroll top.
	 */
	function getDocumentScrollTop() {
		return 0;
	}
	/**
	 * It's possible to run a polyfill inside getDocumentScrollTop, but let's
	 * just return the right property.
	 *
	 * @return {void}
	 */
	function updateGetDocumentScrollTop() {
		if (window.pageYOffset !== undefined) {
			getDocumentScrollTop = function() {
				return window.pageYOffset;
			}
		} else if (document.documentElement) {
			getDocumentScrollTop = function() {
				return document.documentElement.scrollTop;
			}
		} else if (document.body.parentNode) {
			getDocumentScrollTop = function() {
				return document.body.parentNode.scrollTop;
			}
		} else if (document.body) {
			getDocumentScrollTop = function() {
				return document.body.scrollTop;
			}
		}
	}
	/**
	 * Gets the document height. Set as an empty function to be optimized later.
	 *
	 * @return {int} The document height.
	 */
	function getDocumentHeight() {
		return 0;
	}
	/**
	 * It's possible to run Math.max inside of getDocumentHeight, but returning
	 * the proper property is far more efficient.
	 *
	 * @return {void}
	 */
	function updateGetDocumentHeight() {
		var documentHeight = 0;

		if (documentHeight <= document.body.scrollHeight) {
			documentHeight = document.body.scrollHeight;

			getDocumentHeight = function() {
				return document.body.scrollHeight;
			}
		}

		if (documentHeight <= document.body.offsetHeight) {
			documentHeight = document.body.offsetHeight;

			getDocumentHeight = function() {
				return document.body.offsetHeight;
			}
		}

		if (documentHeight <= document.documentElement.clientHeight) {
			documentHeight = document.documentElement.clientHeight;

			getDocumentHeight = function() {
				return document.documentElement.clientHeight;
			}
		}

		if (documentHeight <= document.documentElement.scrollHeight) {
			documentHeight = document.documentElement.scrollHeight;

			getDocumentHeight = function() {
				return document.documentElement.scrollHeight;
			}
		}

		if (documentHeight <= document.documentElement.offsetHeight) {
			documentHeight = document.documentElement.offsetHeight;

			getDocumentHeight = function() {
				return document.documentElement.offsetHeight;
			}
		}
	}
	/**
	 * Updates the current viewport width and height.
	 *
	 * @return {void}
	 */
	function updateCurrentViewport() {
		currentViewport.width = getWindowWidth();
		currentViewport.height = getWindowHeight();
		currentViewport.scrollTop = getDocumentScrollTop();
		currentViewport.scrollBottom = currentViewport.scrollTop + currentViewport.height;
		currentViewport.scrollMax = getDocumentHeight() - currentViewport.height;
	}
	/**
	 * Wraps handleScroll in requestAnimationFrame to optimize performace and
	 * checks to see if we've already requested an animation frame to prevent
	 * stacking.
	 *
	 * @return {void}
	 */
	function handleScrollOptimized() {
		handleOptimized(
			hasRequestedAnimationFrameScroll,
			animationFrameIdScroll,
			handleScroll
		);
	}
	/**
	 * Wrapper to check if animation frame has been requested, to cancel any
	 * stacked request, and add the new request.
	 *
	 * @return {void}
	 */
	function handleOptimized(hasRequestedAnimationFrame, animationFrameId, method) {
		if (!hasRequestedAnimationFrame) {
			hasRequestedAnimationFrame = true;

			cancelAnimationFrame(animationFrameId);
			animationFrameId = requestAnimationFrame(method);
		}
	}
	/**
	 * Fires all viewport.scroll, viewport.scrollUp, and viewport.scrollDown
	 * callbacks based on the scroll direction.
	 *
	 * @return {void}
	 */
	function handleScroll() {
		hasRequestedAnimationFrameScroll = false;

		var windowTopPrev = currentViewport.scrollTop;

		if (!isScrolling) {
			watchForResetScrollTopFinish();

			return;
		}

		updateCurrentViewport();
		updateCurrentViewportScroll();

		var scrollIsAboveTopOfPage = (windowTopPrev < 0 && currentViewport.scrollTop <= 0),
			scrollIsBellowBottomOfPage = (windowTopPrev > currentViewport.scrollMax && currentViewport.scrollTop >= currentViewport.scrollMax);

		if (scrollIsAboveTopOfPage || scrollIsBellowBottomOfPage)
			return;

		dispatcher.fireCallbacks(callbacks.scroll, currentViewport);

		if (windowTopPrev > currentViewport.scrollTop)
			dispatcher.fireCallbacks(callbacks.scrollUp, currentViewport);
		else if (windowTopPrev != currentViewport.scrollTop)
			dispatcher.fireCallbacks(callbacks.scrollDown, currentViewport);
	}
	/**
	 * Checks the scroll top to see if resetScrollTop has finished.
	 *
	 * @return {void}
	 */
	function watchForResetScrollTopFinish() {
		var scrollFinishInterval = setInterval(function() {
			if (getDocumentScrollTop() == resetScrollTopEnd) {
				isScrolling = true;

				clearInterval(scrollFinishInterval);
			}
		}, 1);
	}
	/**
	 * Updates the scroll distance
	 *
	 * @return {void}
	 */
	function updateCurrentViewportScroll() {
		clearTimeout(scrollTimer);

		currentViewport.scrollDistance = currentViewport.scrollTop - currentViewport.scrollStart;

		scrollTimer = setTimeout(function() {
			currentViewport.scrollStart = currentViewport.scrollTop;
		}, scrollTimerLatency);
	}
	/**
	 * Wraps handleResize in requestAnimationFrame to optimize performace and
	 * checks to see if we've already requested an animation frame to prevent
	 * stacking.
	 *
	 * @return {void}
	 */
	function handleResizeOptimized() {
		handleOptimized(
			hasRequestedAnimationFrameResize,
			animationFrameIdResize,
			handleResize
		);
	}
	/**
	 * Fires all viewport.resize callbacks.
	 *
	 * @return {void}
	 */
	function handleResize() {
		hasRequestedAnimationFrameResize = false;

		updateCurrentViewport();
		dispatcher.fireCallbacks(callbacks.resize, currentViewport);
	}
	/**
	 * Checks to see if the html has been resized.
	 *
	 * @return {void}
	 */
	function watchHtmlResize() {
		if (requestAnimationFrameIsSupported)
			checkHtmlSizeOptimized();
		else
			setInterval(checkHtmlSize, 1);
	}
	/**
	 * Wraps checkHtmlSize in requestAnimationFrame to optimize performace.
	 *
	 * @return {void}
	 */
	function checkHtmlSizeOptimized() {
		checkHtmlSize();
		requestAnimationFrame(checkHtmlSizeOptimized);
	}
	/**
	 * Checks the html size and fires window resize if it has changed.
	 *
	 * @return {void}
	 */
	function checkHtmlSize() {
		if (documentHeight != getDocumentHeight()) {
			documentHeight = getDocumentHeight();

			handleResize();
		}
	}
	/**
	 * Gets the distance we need to scroll to to reach an alement accounting for
	 * another element like a fixed header.
	 *
	 * @param {string} selector The selector of the element we want to scroll to
	 * @param {string} selectorToOffset The selector of the element want to account for when scrolling
	 * @return {void}
	 */
	function getScrollDistance(selector, selectorToOffset) {
		var element = document.querySelector(selector);
			elementOffset = getOffset(element).y,
			elementToOffset = {},
			elementToOffsetOffset = 0;

		if (selectorToOffset) {
			elementToOffset = document.querySelector(selectorToOffset),
			elementToOffsetOffset = getOffset(elementToOffset).y;
		}

		return elementOffset - elementToOffsetOffset;
	}
	/**
	 * Gets the x and y offset for a given element.
	 *
	 * @param {object} element The element to get the offset for
	 * @return {void}
	 */
	function getOffset(element) {
		var positionX = 0,
			positionY = 0;

		while (element) {
			positionX += (element.offsetLeft - element.scrollLeft + element.clientLeft);
			positionY += (element.offsetTop - element.scrollTop + element.clientTop);
			element = element.offsetParent;
		}

		return {
			x: positionX,
			y: positionY
		};
	}
	/**
	 * Animates the window scrolling to a given position in a given time using
	 * requestAnimationFrame if available.
	 *
	 * @src http://javascript.info/tutorial/animation
	 *
	 * @param {int} scrollY The final scroll position
	 * @param {int} duration The time to scroll in
	 * @return {void}
	 */
	function scrollTo(scrollY, duration) {
		var timeStart = new Date().getTime();

		if (requestAnimationFrameIsSupported) {
			cancelAnimationFrame(animationFrameIdScrollTo);

			animationFrameIdScrollTo = requestAnimationFrame(function() {
				scrollToWithRequestAnimationFrame(scrollY, timeStart, duration);
			});
		} else {
			clearTimeout(timeoutIdScrollTo);

			scrollToWithTimeout(scrollY, duration);
		}
	}
	/**
	 * Animates the window scrolling to a given position in a given time with
	 * requestAnimationFrame.
	 *
	 * @src http://javascript.info/tutorial/animation
	 *
	 * @param {int} scrollY The final scroll position
	 * @param {int} timeStart The time the animation started
	 * @param {int} duration The time to scroll in
	 * @return {void}
	 */
	function scrollToWithRequestAnimationFrame(scrollY, timeStart, duration) {
		var time = new Date().getTime(),
			difference = scrollY - currentViewport.scrollTop,
			scrollYNew = ((time - timeStart) / duration * scrollY) % scrollY;

		if (time >= (timeStart + duration))
			scrollYNew = scrollY;

		window.scrollTo(0, scrollYNew);

		if (scrollYNew < scrollY)
			animationFrameIdScrollTo = requestAnimationFrame(function() {
				scrollToWithRequestAnimationFrame(scrollY, timeStart, duration);
			});
	}
	/**
	 * Animates the window scrolling to a given position in a given time with
	 * setTimeout.
	 *
	 * @src http://javascript.info/tutorial/animation
	 *
	 * @param {int} scrollY The final scroll position
	 * @param {int} duration The time to scroll in
	 * @return {void}
	 */
	function scrollToWithTimeout(scrollY, duration) {
		if (duration < 0)
			return;

		var difference = scrollY - currentViewport.scrollTop,
			differencePerInterval = difference / duration * 10,
			scrollYNew = currentViewport.scrollTop + differencePerInterval;

		timeoutIdScrollTo = setTimeout(function() {
			window.scrollTo(0, scrollYNew);
			handleScroll();

			if (scrollYNew < scrollY)
				scrollToWithTimeout(scrollY, duration - 10);
		}, 10);
	}
	/**
	 * All modules should load themselves.
	 */
	load();

	return {
		/**
		 * Adds a function to the callbacks.scroll queue.
		 *
		 * @param {function} function The callback function to add to the callbacks.scroll queue
		 * @return {object} Current viewport
		 */
		scroll: function(callback) {
			callbacks.scroll.push(callback);
		},
		/**
		 * Adds a function to the callbacks.scrollUp queue.
		 *
		 * @param {function} function The callback function to add to the callbacks.scrollUp queue
		 * @return {object} Current viewport
		 */
		scrollUp: function(callback) {
			callbacks.scrollUp.push(callback);
		},
		/**
		 * Adds a function to the callbacks.scrollDown queue.
		 *
		 * @param {function} function The callback function to add to the callbacks.scrollDown queue
		 * @return {object} Current viewport
		 */
		scrollDown: function(callback) {
			callbacks.scrollDown.push(callback);
		},
		/**
		 * Adds a function to the callbacks.resize queue.
		 *
		 * @param {function} function The callback function to add to the callbacks.resize queue
		 * @return {object} Current viewport
		 */
		resize: function(callback) {
			callbacks.resize.push(callback);
		},
		/**
		 * Scrolls the viewport to a y position accomodating for the header.
		 *
		 * @param {int} position The y position to scroll to
		 * @return {void}
		 */
		scrollTo: function(selector, selectorToOffset) {
			var maxScroll = Math.min(
					getScrollDistance(selector, selectorToOffset),
					currentViewport.scrollMax
				);

			scrollTo(maxScroll, SCROLL_TO_SPEED);
		},
		/**
		 * Gets the current viewport.
		 *
		 * @return {object} Current viewport
		 */
		get: function() {
			return currentViewport;
		},
		/**
		 * Sets the scrollTop for a given namespace.
		 *
		 * @return {object} Current viewport
		 */
		setScrollTop: function(namespace) {
			scrollTop[namespace] = currentViewport.scrollTop;
		},
		/**
		 * Resets the scrollTop for a given namespace and prevents scroll events
		 * from firing.
		 *
		 * @return {object} Current viewport
		 */
		resetScrollTop: function(namespace) {
			var namespaceScrollTop = scrollTop[namespace];

			if (typeof namespaceScrollTop !== "undefined") {
				resetScrollTopEnd = namespaceScrollTop;
				isScrolling = false;

				window.scrollTo(0, resetScrollTopEnd);
			}
		},
		/**
		 * Unsets the scrollTop for a given namespace.
		 *
		 * @return {object} Current viewport
		 */
		unsetScrollTop: function(namespace) {
			delete scrollTop[namespace];
		}
	};
});