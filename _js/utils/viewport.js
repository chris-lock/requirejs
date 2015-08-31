'use strict';

/**
 * The viewport utility handles window events and returns an object with the
 * current viewport height, width, scroll top, scoll bottom, scroll total and
 * scroll distance.
 *
 * @author Chris Lock
 *
 * @param {object} Dispatcher Dispatcher utility.
 * @return {object} Public methods.
 */
define(['Dispatcher'], function(Dispatcher) {
		/** @type {int} The number of milliseconds of inactivity considered a scroll stop. */
	var	SCROLL_TIMER_LATENCY = 200,
		/** @constant Scroll to speed. */
		SCROLL_TO_SPEED = 1000;

		/** @type {int} The object of current viewport properties. */
	var currentViewport = {
			width: 0,
			height: 0,
			isScrollingUp: false,
			isScrollingDown: false,
			scrollStart: 0,
			scrollDistance: 0,
			scrollUpStart: 0,
			scrollUpDistance: 0,
			scrollDownStart: 0,
			scrollDownDistance: 0,
			scrollTop: 0,
			scrollTopMax: 0,
			scrollBottom: 0,
			scrollBottomMax: 0
		},
		/** @type {int} The object of previous viewport properties. */
		previousViewport = currentViewport,
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
		/** @type {bool} Are we animating scroll. */
		isSelfScrolling = true,
		/** @type {bool} Is this touch scrolling. */
		isTouchScrolling = false,
		/** @type {bool} Should we allow touch scroll. */
		shouldAllowTouchScroll = true,
		/** @type {int} The scrollTop when touch started. */
		scrollTopTouchStart = 0,
		/** @type {int} The client y when touch started. */
		scrollTouchClientYStart = 0,
		/** @type {int} The client y durring touch events. */
		scrollTouchClientYCurrent = 0,
		/** @type {int} The page y when touch started. */
		scrollTouchPageYStart = 0,
		/** @type {int} The page y durring touch events. */
		scrollTouchPageYCurrent = 0,
		/** @type {int} The timer used to detect scroll stop. */
		scrollTimer = null,
		/** @type {object} Callback queue for each event. */
		callbacks = {
			scroll: [],
			scrollUp: [],
			scrollDown: [],
			touch: {
				scroll: [],
				scrollUp: [],
				scrollDown: []
			},
			resize: [],
			resizeHeight: [],
			resizeHtml: [],
			resizeWidth: []
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
		updateGetFunctions();
		updateCurrentViewport();
		bindScrollEvents();
		bindResizeEvents();
	}
	/**
	 * We update all get functions to reduce the overhead added by polyfills.
	 *
	 * @return {void}
	 */
	function updateGetFunctions() {
		updateRequestAnimationFrame();
		updateGetWindowDimensions();
		updateGetDocumentScrollTop();
		updateGetDocumentHeight();
	}
	/**
	 * Binds window scroll for default events and touch events for touch scroll.
	 *
	 * @return {void}
	 */
	function bindScrollEvents() {
		window.onscroll = handleScrollOptimized;
		addEvent('touchstart', startTouchScroll);
		addEvent('touchmove', handleTouchScroll);
		addEvent('touchend', endTouchScroll);
		addEvent('touchcancel', endTouchScroll);
	}
	/**
	 * Binds resize events and watches the dom for height changes.
	 *
	 * @return {void}
	 */
	function bindResizeEvents() {
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

		if (!window.requestAnimationFrame) {
			window.requestAnimationFrame = function(callback) {
				callback();
			};
		} else {
			requestAnimationFrameIsSupported = true;
		}

		if (!window.cancelAnimationFrame) {
			window.cancelAnimationFrame = function() {};
		}
	}
	/**
	 * Gets the window width. Set as an optimized function later.
	 *
	 * @return {int} The window width.
	 */
	var getWindowWidth;
	/**
	 * Gets the window height. Set as an optimized function later.
	 *
	 * @return {int} The window height.
	 */
	var getWindowHeight;
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
	var getDocumentScrollTop;
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
			};
		} else if (document.documentElement) {
			getDocumentScrollTop = function() {
				return document.documentElement.scrollTop;
			};
		} else if (document.body.parentNode) {
			getDocumentScrollTop = function() {
				return document.body.parentNode.scrollTop;
			};
		} else if (document.body) {
			getDocumentScrollTop = function() {
				return document.body.scrollTop;
			};
		}
	}
	/**
	 * Gets the document height. Set as an optimized function later.
	 *
	 * @return {int} The document height.
	 */
	var getDocumentHeight;
	/**
	 * It's possible to run Math.max inside of getDocumentHeight, but returning
	 * the proper property is far more efficient.
	 *
	 * @return {void}
	 */
	function updateGetDocumentHeight() {
		var documentHeight = 0;

		if (documentHeight < document.body.scrollHeight) {
			documentHeight = document.body.scrollHeight;

			getDocumentHeight = function() {
				return document.body.scrollHeight;
			};
		}

		if (documentHeight < document.body.offsetHeight) {
			documentHeight = document.body.offsetHeight;

			getDocumentHeight = function() {
				return document.body.offsetHeight;
			};
		}

		if (documentHeight < document.documentElement.clientHeight) {
			documentHeight = document.documentElement.clientHeight;

			getDocumentHeight = function() {
				return document.documentElement.clientHeight;
			};
		}

		if (documentHeight < document.documentElement.scrollHeight) {
			documentHeight = document.documentElement.scrollHeight;

			getDocumentHeight = function() {
				return document.documentElement.scrollHeight;
			};
		}

		if (documentHeight < document.documentElement.offsetHeight) {
			documentHeight = document.documentElement.offsetHeight;

			getDocumentHeight = function() {
				return document.documentElement.offsetHeight;
			};
		}
	}
	/**
	 * Updates the current viewport width and height, and ensures the scrollTop
	 * is not outside the window since webkit continues firing scroll events
	 * when over scrolling.
	 *
	 * @return {void}
	 */
	function updateCurrentViewport() {
		previousViewport = getPreviousViewport();

		currentViewport.width = getWindowWidth();
		currentViewport.height = getWindowHeight();
		currentViewport.scrollBottomMax = getDocumentHeight();
		currentViewport.scrollTopMax = Math.max(
			currentViewport.scrollBottomMax - currentViewport.height,
			0
		);

		currentViewport.scrollTop = Math.min(
			currentViewport.scrollTopMax,
			Math.max(
				getDocumentScrollTopAll(),
				0
			)
		);
		currentViewport.scrollBottom = currentViewport.scrollTop + currentViewport.height;
	}
	/**
	 * A wrapper to get scrollTop for both non touch and touch scrolling.
	 *
	 * @return {object} The previous viewport clone from the state of the current viewport
	 */
	function getPreviousViewport() {
		return JSON.parse(JSON.stringify(currentViewport));
	}
	/**
	 * A wrapper to get scrollTop for both non touch and touch scrolling.
	 *
	 * @return {int} The document scroll top.
	 */
	function getDocumentScrollTopAll() {
		return (isTouchScrolling)
			? getDocumentScrollTopTouch()
			: getDocumentScrollTop();
	}
	/**
	 * Gets the approximate scroll top based on the the client y change during
	 * touch. For some reason this is consistently 10px off.
	 *
	 * @return {int} The approximate document scroll top.
	 */
	function getDocumentScrollTopTouch() {
		var scrollTouchClientYChange = scrollTouchClientYStart - scrollTouchClientYCurrent,
			scrollTouchPageYChange = scrollTouchPageYCurrent - scrollTouchPageYStart;

		return scrollTopTouchStart + scrollTouchClientYChange + scrollTouchPageYChange;
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

			window.cancelAnimationFrame(animationFrameId);
			animationFrameId = window.requestAnimationFrame(method);
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

		var windowTopPrevious = currentViewport.scrollTop;

		if (!isSelfScrolling) {
			watchForResetScrollTopFinish();

			return;
		}

		updateCurrentViewport();
		updateCurrentViewportScroll();

		fireCallbacks('scroll', currentViewport, isTouchScrolling);

		if (windowTopPrevious > currentViewport.scrollTop) {
			fireCallbacks('scrollUp', currentViewport, isTouchScrolling);
		} else if (windowTopPrevious != currentViewport.scrollTop) {
			fireCallbacks('scrollDown', currentViewport, isTouchScrolling);
		}
	}
	/**
	 * Checks the scroll top to see if resetScrollTop has finished.
	 *
	 * @return {void}
	 */
	function watchForResetScrollTopFinish() {
		var scrollFinishInterval = setInterval(function() {
			if (getDocumentScrollTop() == resetScrollTopEnd) {
				isSelfScrolling = true;

				clearInterval(scrollFinishInterval);
			}
		}, 1);
	}
	/**
	 * Updates the scroll distance for all scrolling, scrolling up, and
	 * scrolling down.
	 *
	 * @return {void}
	 */
	function updateCurrentViewportScroll() {
		updateCurrentViewportScrollChange();

		currentViewport.scrollDistance = currentViewport.scrollTop - currentViewport.scrollStart;
		currentViewport.scrollUpDistance = currentViewport.scrollUpStart - currentViewport.scrollTop;
		currentViewport.scrollDownDistance = currentViewport.scrollTop - currentViewport.scrollDownStart;
	}
	/**
	 * Marks the points where scroll start changes on all scrolling, scrolling
	 * up, and scrolling down.
	 *
	 * @return {void}
	 */
	function updateCurrentViewportScrollChange() {
		currentViewport.isScrollingUp = currentViewport.scrollTop > previousViewport.scrollTop;
		currentViewport.isScrollingDown = currentViewport.scrollTop < previousViewport.scrollTop;

		if (previousViewport.isScrollingUp != currentViewport.isScrollingUp) {
			currentViewport.scrollUpStart = currentViewport.scrollTop;
		}

		if (previousViewport.isScrollingDown != currentViewport.isScrollingDown) {
			currentViewport.scrollDownStart = currentViewport.scrollTop;
		}

		clearTimeout(scrollTimer);

		scrollTimer = setTimeout(function() {
			currentViewport.scrollStart = currentViewport.scrollTop;
			currentViewport.scrollUpStart = currentViewport.scrollStart;
			currentViewport.scrollDownStart = currentViewport.scrollStart;
		}, SCROLL_TIMER_LATENCY);
	}
	/**
	 * A wrapper for firing callbacks to handle touch and non touch callbacks.
	 *
	 * @param {string} callbackType The type of callback being fired
	 * @param {object} currentViewport The object containing the current viewport
	 * @param {bool} isTouchScrolling Is this a touch scroll event
	 * @return {void}
	 */
	function fireCallbacks(callbackType, currentViewport, isTouchScrolling) {
		Dispatcher.fireCallbacks(callbacks[callbackType], currentViewport);

		if (isTouchScrolling) {
			Dispatcher.fireCallbacks(callbacks.touch[callbackType], currentViewport);
		}
	}
	/**
	 * Wrapper for addEventListener since IE8 is a whiny baby and doesn't
	 * support it.
	 *
	 * @return {void}
	 */
	function addEvent(event, eventFunction) {
		if (document.addEventListener) {
			document.addEventListener(event, eventFunction);
		} else if (document.attachEvent) {
			document.attachEvent(event, eventFunction);
		}
	}
	/**
	 * Sets touch variables ued for calculation in touchmove events if
	 * touchScroll isn't currently prevented.
	 *
	 * @param {object} event The touch event
	 * @return {void}
	 */
	function startTouchScroll(event) {
		if (shouldAllowTouchScroll) {
			scrollTopTouchStart = currentViewport.scrollTop;
			scrollTouchPageYStart = scrollTouchPageYCurrent = getTouchPageY(event);
			scrollTouchClientYStart = scrollTouchClientYCurrent = getTouchClientY(event);
		}
	}
	/**
	 * Gets the page y from the touch even.
	 *
	 * @param {object} event The touch event
	 * @return {int} The page y.
	 */
	function getTouchPageY(event) {
		return getTouch(event).pageY;
	}
	/**
	 * Gets the touches object since it's set diferently acroos browsers and
	 * even in between touchstart, touchmove, and touchend.
	 *
	 * @param {object} event The touch event
	 * @return {object} The touch.
	 */
	function getTouch(event) {
		var touches = event.touches
				|| event.changedTouches
				|| event.originalEvent.touches
				|| event.originalEvent.changedTouches;

		return touches[0];
	}
	/**
	 * Gets the client y from the touch event.
	 *
	 * @param {object} event The touch event
	 * @return {int} The client y.
	 */
	function getTouchClientY(event) {
		return getTouch(event).clientY;
	}
	/**
	 * Sets touch variables used in calculations on scrollTop and fires scroll
	 * event unless touchScroll is currently prevented.
	 *
	 * @param {object} event The touch event
	 * @return {void}
	 */
	function handleTouchScroll(event) {
		if (!shouldAllowTouchScroll) {
			event.preventDefault();

			return;
		}

		scrollTouchPageYCurrent = getTouchPageY(event);
		scrollTouchClientYCurrent = getTouchClientY(event);

		isTouchScrolling = true;

		handleScroll();

		isTouchScrolling = false;
	}
	/**
	 * Fires a final scroll event on touchend if touchScroll isn't currently
	 * prevented.
	 *
	 * @param {string} listenTo Event to listen to
	 * @param {function} eventFunction The function to add to the event
	 * @return {void}
	 */
	function endTouchScroll() {
		if (shouldAllowTouchScroll) {
			handleScroll();
		}
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

		Dispatcher.fireCallbacks(callbacks.resize, currentViewport);

		if (previousViewport.height !== currentViewport.height) {
			Dispatcher.fireCallbacks(callbacks.resizeHeight, currentViewport);
		}

		if (previousViewport.width !== currentViewport.width) {
			Dispatcher.fireCallbacks(callbacks.resizeWidth, currentViewport);
		}
	}
	/**
	 * Checks to see if the html has been resized.
	 *
	 * @return {void}
	 */
	function watchHtmlResize() {
		if (requestAnimationFrameIsSupported) {
			checkHtmlSizeOptimized();
		} else {
			setInterval(checkHtmlSize, 1);
		}
	}
	/**
	 * Wraps checkHtmlSize in requestAnimationFrame to optimize performace.
	 *
	 * @return {void}
	 */
	function checkHtmlSizeOptimized() {
		checkHtmlSize();
		window.requestAnimationFrame(checkHtmlSizeOptimized);
	}
	/**
	 * Checks the html size and fires html resize if it has changed.
	 *
	 * @return {void}
	 */
	function checkHtmlSize() {
		if (documentHeight != getDocumentHeight()) {
			documentHeight = getDocumentHeight();
			updateCurrentViewport();

			Dispatcher.fireCallbacks(callbacks.resizeHtml, currentViewport);
		}
	}
	/**
	 * Added a callback for a scroll event and adds it to touch events if asked.
	 *
	 * @param {string} event The enter or leave event.
	 * @param {function} callback The callback to add to the queue.
	 * @param {bool} shouldAddToTouch Should the event be added to touch scroll
	 * @return {void}
	 */
	function addCallbackToEvent(event, callback, shouldAddToTouch) {
		callbacks[event].push(callback);

		if (shouldAddToTouch) {
			callbacks.touch[event].push(callback);
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
		var element = document.querySelector(selector),
			elementOffset = getOffset(element).y,
			elementToOffset = {},
			elementToOffsetOffset = 0;

		if (selectorToOffset) {
			elementToOffset = document.querySelector(selectorToOffset);
			elementToOffsetOffset = getOffset(elementToOffset).y + elementToOffset.offsetHeight;
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
			element.style.display = 'block';
			positionX += (element.offsetLeft + element.clientLeft);
			positionY += (element.offsetTop + element.clientTop);
			element.style.display = '';

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
	 * @param {bool} scrollIsDown Is the scroll going down
	 * @param {int} duration The time to scroll in
	 * @param {function} callback The callback function to fire after scrolling
	 * @return {void}
	 */
	function scrollTo(scrollY, scrollIsDown, duration, callback) {
		var timeStart = new Date().getTime();

		if (requestAnimationFrameIsSupported) {
			window.cancelAnimationFrame(animationFrameIdScrollTo);

			animationFrameIdScrollTo = window.requestAnimationFrame(function() {
				scrollToWithRequestAnimationFrame(scrollY, scrollIsDown, timeStart, duration, callback);
			});
		} else {
			clearTimeout(timeoutIdScrollTo);

			scrollToWithTimeout(scrollY, scrollIsDown, duration, callback);
		}
	}
	/**
	 * Animates the window scrolling to a given position in a given time with
	 * requestAnimationFrame.
	 *
	 * @src http://javascript.info/tutorial/animation
	 *
	 * @param {int} scrollY The final scroll position
	 * @param {bool} scrollIsDown Is the scroll going down
	 * @param {int} timeStart The time the animation started
	 * @param {int} duration The time to scroll in
	 * @param {function} callback The callback function to fire after scrolling
	 * @return {void}
	 */
	function scrollToWithRequestAnimationFrame(scrollY, scrollIsDown, timeStart, duration, callback) {
		var time = new Date().getTime(),
			difference = scrollY - currentViewport.scrollTop,
			differencePerInterval = ((time - timeStart) / duration * difference) % difference || 0,
			scrollYNew = currentViewport.scrollTop + differencePerInterval;

		if (time >= (timeStart + duration)) {
			scrollYNew = scrollY;
		}

		scrollToStep(scrollYNew);

		if (scrollToIsNotFinished(scrollYNew, scrollY, scrollIsDown)) {
			animationFrameIdScrollTo = window.requestAnimationFrame(function() {
				scrollToWithRequestAnimationFrame(scrollY, scrollIsDown, timeStart, duration, callback);
			});
		} else {
			Dispatcher.fireCallbacks([callback], currentViewport);
		}
	}
	/**
	 * Updates the window scrollTo and fires scroll events.
	 *
	 * @param {int} scrollYNew The new scroll position
	 * @return {void}
	 */
	function scrollToStep(scrollYNew) {
		setScrollTop(scrollYNew);
		handleScroll();
	}
	/**
	 * Sets the scrolltop of the window.
	 *
	 * @param {int} scrollTop The scrollTop to set to.
	 * @return {void}
	 */
	function setScrollTop(scrollTop) {
		window.scrollTo(0, scrollTop);
	}
	/**
	 * Checks to see if the scrollTo has reached is destination.
	 *
	 * @param {int} scrollYNew The new scroll position
	 * @param {int} scrollY The final scroll position
	 * @param {bool} scrollIsDown Is the scroll going down
	 * @return {void}
	 */
	function scrollToIsNotFinished(scrollYNew, scrollY, scrollIsDown) {
		var scrollDownIsFinished = (scrollYNew < scrollY && scrollIsDown),
			scrollUpIsFinished = (scrollYNew > scrollY && !scrollIsDown);

		return (scrollDownIsFinished || scrollUpIsFinished);
	}
	/**
	 * Animates the window scrolling to a given position in a given time with
	 * setTimeout.
	 *
	 * @src http://javascript.info/tutorial/animation
	 *
	 * @param {int} scrollY The final scroll position
	 * @param {bool} scrollIsDown Is the scroll going down
	 * @param {int} duration The time to scroll in
	 * @param {function} callback The callback function to fire after scrolling
	 * @return {void}
	 */
	function scrollToWithTimeout(scrollY, scrollIsDown, duration, callback) {
		if (duration < 0) {
			return;
		}

		var difference = scrollY - currentViewport.scrollTop,
			differencePerInterval = difference / duration * 10,
			scrollYNew = currentViewport.scrollTop + differencePerInterval;

		timeoutIdScrollTo = setTimeout(function() {
			scrollToStep(scrollYNew);

			if (scrollToIsNotFinished(scrollYNew, scrollY, scrollIsDown)) {
				scrollToWithTimeout(scrollY, scrollIsDown, duration - 10, callback);
			} else {
				Dispatcher.fireCallbacks([callback], currentViewport);
			}
		}, 10);
	}
	/**
	 * All utils should load themselves.
	 */
	load();

	return {
		/**
		 * Adds a function to the scroll queue for non touch events.
		 *
		 * @param {function} function The callback function to add to the scroll queue
		 * @return {object} This for method chaining
		 * 		@return {object} Current viewport
		 */
		scroll: function(callback) {
			addCallbackToEvent('scroll', callback);

			return this;
		},
		/**
		 * Adds a function to the scroll queue for non touch and touch events.
		 * Touch scroll events are not the most consistent or accurate.
		 *
		 * @param {function} function The callback function to add to the scroll queue
		 * @return {object} This for method chaining
		 * 		@return {object} Current viewport
		 */
		touchScroll: function(callback) {
			addCallbackToEvent('scroll', callback, true);

			return this;
		},
		/**
		 * Adds a function to the scrollUp queue for non touch events.
		 *
		 * @param {function} function The callback function to add to the scrollUp queue
		 * @return {object} This for method chaining
		 * 		@return {object} Current viewport
		 */
		scrollUp: function(callback) {
			addCallbackToEvent('scrollUp', callback);

			return this;
		},
		/**
		 * Adds a function to the scrollUp queue for non touch and touch events.
		 * Touch scroll events are not the most consistent or accurate.
		 *
		 * @param {function} function The callback function to add to the scrollUp queue
		 * @return {object} This for method chaining
		 * 		@return {object} Current viewport
		 */
		touchScrollUp: function(callback) {
			addCallbackToEvent('scrollUp', callback, true);

			return this;
		},
		/**
		 * Adds a function to the scrollDown queue for non touch events.
		 *
		 * @param {function} function The callback function to add to the scrollDown queue
		 * @return {object} This for method chaining
		 * 		@return {object} Current viewport
		 */
		scrollDown: function(callback) {
			addCallbackToEvent('scrollDown', callback);

			return this;
		},
		/**
		 * Adds a function to the scrollDown queue for non touch and touch events.
		 * Touch scroll events are not the most consistent or accurate.
		 *
		 * @param {function} function The callback function to add to the scrollDown queue
		 * @return {object} This for method chaining
		 * 		@return {object} Current viewport
		 */
		touchScrollDown: function(callback) {
			addCallbackToEvent('scrollDown', callback, true);

			return this;
		},
		/**
		 * Prevent touch scrolling by preventing default on touch events.
		 *
		 * @param {bool} shouldPreventTouchScroll Should we prevent touch scroll
		 * @return {object} This for method chaining
		 * 		@return {void}
		 */
		preventTouchScroll: function(shouldPreventTouchScroll) {
			shouldAllowTouchScroll = !shouldPreventTouchScroll;

			return this;
		},
		/**
		 * Adds a function to the resize queue.
		 *
		 * @param {function} function The callback function to add to the resize queue
		 * @return {object} This for method chaining
		 * 		@return {object} Current viewport
		 */
		resize: function(callback) {
			callbacks.resize.push(callback);

			return this;
		},
		/**
		 * Adds a function to the resizeWidth queue.
		 *
		 * @param {function} function The callback function to add to the resizeWidth queue
		 * @return {object} This for method chaining
		 * 		@return {object} Current viewport
		 */
		resizeWidth: function(callback) {
			callbacks.resizeWidth.push(callback);

			return this;
		},
		/**
		 * Adds a function to the resizeHeight queue.
		 *
		 * @param {function} function The callback function to add to the resizeHeight queue
		 * @return {object} This for method chaining
		 * 		@return {object} Current viewport
		 */
		resizeHeight: function(callback) {
			callbacks.resizeHeight.push(callback);

			return this;
		},
		/**
		 * Adds a function to the resizeHtml queue.
		 *
		 * @param {function} function The callback function to add to the resizeHtml queue
		 * @return {object} This for method chaining
		 * 		@return {object} Current viewport
		 */
		resizeHtml: function(callback) {
			callbacks.resizeHtml.push(callback);

			return this;
		},
		/**
		 * Scrolls the viewport to a selector accomodating for the height of
		 * another element.
		 *
		 * @param {string} selector The selector of the element to scroll to
		 * @param {int} scrollSpeed The speed to scroll at
		 * @param {string} selector The selector of the element that needs it's height offset like a header
		 * @param {function} callback The callback function to fire after scrolling
		 * @return {object} This for method chaining
		 */
		scrollTo: function(selector, scrollSpeed, selectorToOffset, callback) {
			updateCurrentViewport();

			var scrollY = getScrollDistance(selector, selectorToOffset),
				scrollIsDown = (scrollY > currentViewport.scrollTop),
				scrollYMin = Math.max(scrollY, 0),
				scrollYMax = Math.min(scrollYMin, currentViewport.scrollTopMax),
				scrollSpeedFinal = scrollSpeed || SCROLL_TO_SPEED;

			scrollTo(scrollYMax, scrollIsDown, scrollSpeedFinal, callback);

			return this;
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
		 * @return {object} This for method chaining
		 */
		setScrollTopNamespace: function(namespace) {
			scrollTop[namespace] = currentViewport.scrollTop;

			return this;
		},
		/**
		 * Resets the scrollTop for a given namespace and prevents scroll events
		 * from firing.
		 *
		 * @return {object} This for method chaining
		 */
		resetScrollTopNamespace: function(namespace) {
			var namespaceScrollTop = scrollTop[namespace];

			if (typeof namespaceScrollTop !== 'undefined') {
				resetScrollTopEnd = namespaceScrollTop;
				isSelfScrolling = false;

				setScrollTop(resetScrollTopEnd);
			}

			return this;
		},
		/**
		 * Sets the scrollTop of the window to a given value.
		 *
		 * @param {int} scrollTop The scrollTop to set to.
		 * @return {object} This for method chaining
		 */
		setScrollTop: function(scrollTop) {
			setScrollTop(scrollTop);

			return this;
		},
		/**
		 * Unsets the scrollTop for a given namespace.
		 *
		 * @return {object} This for method chaining
		 */
		unsetScrollTop: function(namespace) {
			delete scrollTop[namespace];

			return this;
		}
	};
});