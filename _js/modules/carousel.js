/**
 * Handles all carousels setup and breakdown for breakpoints.
 *
 * @author Chris Lock
 *
 * @param {object} jquery jQuery library.
 * @param {object} breakpoints Breakpoints utility.
 * @param {object} os OS utility.
 * @return {object} Public methods.
 */
define(['jquery', 'breakpoints', 'os'], function($, breakpoints, os) {
		/** @constant Carousel class. */
	var CAROUSEL_CLASS = 'carousel',
		/** @constant Carousel selector. */
		CAROUSEL_SELECTOR = '.' + CAROUSEL_CLASS,
		/** @constant Namespace used in jQuery. */
		JQUERY_NAMESPACE = CAROUSEL_SELECTOR,
		/** @constant The data attribute base for slides shown if more than one slide should be visible at a time. */
		SLIDES_SHOW_DATA_BASE = 'carousel_slides_shown_',
		/** @constant Carousel slide selector. */
		SLIDE_SELECTOR = CAROUSEL_SELECTOR + '-slide',
		/** @constant Carousel slide active class. */
		SLIDE_ACTIVE_CLASS = '_active',
		/** @constant Carousel slide inactive selector. */
		SLIDE_INACTIVE_SELECTOR = '._inactive',
		/** @constant Carousel slide hidden selector. */
		SLIDE_HIDDEN_SELECTOR = '._hidden',
		/** @constant Carousel inner selector. */
		CAROUSEL_INNER_SELECTOR = CAROUSEL_SELECTOR + '-inner',
		/** @constant Carousel nav selector. */
		NAV_SELECTOR = CAROUSEL_SELECTOR + '-nav',
		/** @constant Carousel nav link class. */
		NAV_LINK_CLASS =  CAROUSEL_CLASS + '-nav-link',
		/** @constant Carousel nav link prev class. */
		NAV_LINK_PREV_CLASS = NAV_LINK_CLASS + '-prev',
		/** @constant Carousel nav link next class. */
		NAV_LINK_NEXT_CLASS = NAV_LINK_CLASS + '-next',
		/** @constant Carousel nav link disabled class. */
		NAV_LINK_DISABLED_CLASS = '_disabled',
		/** @constant Carousel pagination class. */
		PAGINATION_CLASS = CAROUSEL_CLASS + '-pagination',
		/** @constant Carousel pagination selector. */
		PAGINATION_SELECTOR = '.' + PAGINATION_CLASS,
		/** @constant Carousel pagination link class. */
		PAGINATION_LINK_CLASS = PAGINATION_CLASS + '-link',
		/** @constant Carousel pagination link index class. */
		PAGINATION_LINK_INDEX_CLASS = PAGINATION_LINK_CLASS + '-index',
		/** @constant Carousel draggable class for carousels with enough slides. */
		DRAGGABLE_CLASS = '_draggable',
		/** @constant Carousel dragging class. */
		DRAGGING_CLASS = '_dragging',
		/** @constant Carousel dragge class. */
		DRAGGED_CLASS = '_dragged',
		/** @constant The number of empty slide to pad the end of the carousel with. Mainly for CSS bugs on Android */
		CAROUSEL_SPACING_SLIDES = 1,
		/** @constant The minimun drag needed to lock scroll on touch. */
		DRAG_MIN_SCROLL_LOCK = 5,
		/** @constant The percent of the drag that should have snap resistence. */
		DRAG_RATIO_SNAP_THRESHOLD = 25,
		/** @constant The exponential power of the resitence. i.e. x^n */
		DRAG_SNAP_RESISTANCE_EXPONENT = 3,
		/** @constant Class added and removed to fix IE8 hover bug */
		IE8_INACTIVE_CLASS = '_inactive',
		/** @constant Event fired when a card becomes active. */
		ON_CARD_EVENT_ENTER = 'carouselCardEnter',
		/** @constant Event fired when a card loses active state. */
		ON_CARD_EVENT_LEAVE = 'carouselCardLEAVE';

		/** @constant Base used for the carousel nav links. */
	var NAV_LINK_BASE =
		'<a class="' + NAV_LINK_CLASS + ' ' + IE8_INACTIVE_CLASS + ' {{link_class}}" href="#">' +
			'{{link_title}} Slide' +
		'</a>',
		/** @constant Carousel nav previous link. */
		NAV_LINK_PREV =
			NAV_LINK_BASE
				.replace('{{link_class}}', NAV_LINK_PREV_CLASS)
				.replace('{{link_title}}', 'Previous'),
		/** @constant Carousel nav next link. */
		NAV_LINK_NEXT =
			NAV_LINK_BASE
				.replace('{{link_class}}', NAV_LINK_NEXT_CLASS)
				.replace('{{link_title}}', 'Next'),
		/** @constant Base used for the carousel pagination links. */
		PAGINATION_LINK_BASE =
			'<li>' +
				'<a class="' + PAGINATION_LINK_CLASS + '" href="#">' +
					'<span class="' + PAGINATION_LINK_CLASS + '-slide">Slide </span>' +
					'<span class="' + PAGINATION_LINK_INDEX_CLASS + '">{{link_number}}</span>' +
				'</a>' +
			'</li>',
		/** @constant Base used for the carousel pagination. */
		PAGINATION_BASE =
			'<ul>{{links}}</ul>' +
			'<p class="' + PAGINATION_CLASS + '-count">' +
				'of <span class="' + PAGINATION_CLASS + '-total">{{link_total}}</span>' +
			'</p>';

		/** @type {object} Breakpoints supported. */
	var breakpointsSupported = {
			'standard': true,
			'medium': true,
			'small': true
		},
		/** @type {bool} Device supports touch. */
		isTouch = os.supportsTouch(),
		/** @type {bool} Has the minimum drag been reached for mobile scroll lock. */
		dragStartIsLongEnough = false,
		/** @type {bool} Is a carousel dragging. */
		isDragging = false,
		/** @type {int} The interval the carousel snaps to as a ratio. */
		snapInterval = 0,
		/** @type {int} The interval the carousel snaps to as a percent. */
		snapIntervalPercent = 0,
		/** @type {int} Percent width of the current carousel. */
		carouselInnerWidthPercent = 0,
		/** @type {int} Starting carousel offset percent. */
		carouselInnerLeftStartPercent = 0,
		/** @type {int} The index of the current slide. */
		slideIndexCurrent = 0,
		/** @type {int} The max index the carousel can slide to. */
		slideIndexMax = 0,
		/** @type {int} Starting drag position. */
		dragStart = 0,
		/** @type {int} The drag length as a percent of the carousel width. */
		dragPercent = 0,
		/** @type {int} The last time a drag event was fired. */
		dragTime = 0,
		/** @type {int} The current speed of the drag. */
		dragSpeed = 0,
		/** @type {int} Ending drag position. */
		dragEnd = 0;

		/** @type {object} jQuery object containing the carousels. */
	var $carousels = $(CAROUSEL_SELECTOR),
		/** @type {object} jQuery object containing carousel slides. */
		$slides = $(SLIDE_SELECTOR),
		/** @type {object} jQuery object containing carousel inners. */
		$carouselInners = $(CAROUSEL_INNER_SELECTOR),
		/** @type {object} jQuery object containing carousel navs. */
		$carouselNavs = $(NAV_SELECTOR),
		/** @type {object} jQuery object containing carousel paginations. */
		$carouselPaginations = $(PAGINATION_SELECTOR),
		/** @type {object} jQuery object containing the breakpoint carousels. */
		$breakpointCarousels = {};

	/**
	 * Sets the $breakpointCarousels with a property for each breakpoint
	 * containing an jQuery object of carousels.
	 *
	 * @return {void}
	 */
	function setBreakpointCarousels() {
		if (breakpointsSupported) {
			for (var breakpoint in breakpointsSupported) {
				$breakpointCarousels[breakpoint] =
					$carousels.filter(CAROUSEL_SELECTOR + '-' + breakpoint);
			}
		}
	}
	/**
	 * Set the jQuery object to include new carousels, updates the breakpoint
	 * carousels, abd call rebuild.
	 *
	 * @return {void}
	 */
	function buildCarousels() {
		$carousels = $(CAROUSEL_SELECTOR);
		setBreakpointCarousels();
		rebuildCarousels();
	}
	/**
	 * Destroys all current carousels and builds all the carousels for the
	 * current breakpoint.
	 *
	 * @return {void}
	 */
	function rebuildCarousels() {
		var $currentBreakpointCarousels = getBreakpointCarousels();
		destroyCarousels();
		$currentBreakpointCarousels.each(buildCarousel);
	}
	/**
	 * Get the carousels for the current breakpoint.
	 *
	 * @return {object} jQuery object containing current breakpoint carousels
	 */
	function getBreakpointCarousels() {
		for (var breakpoint in breakpointsSupported) {
			if (breakpoints.is(breakpoint)) {
				if ($breakpointCarousels[breakpoint]) {
					return $breakpointCarousels[breakpoint];
				}
			}
		}

		return {};
	}
	/**
	 * Removes all inline css and js classes for carousels and unbinds events.
	 *
	 * @return {void}
	 */
	function destroyCarousels() {
		$carousels
			.removeClass(DRAGGABLE_CLASS)
			.removeClass(DRAGGED_CLASS)
			.removeClass(DRAGGING_CLASS);

		$carouselInners.outerWidth('').css('left', '');
		$slides.outerWidth('');

		$carouselNavs.empty();
		$carouselPaginations.empty();

		updateEvents($carousels, 'unbind');
	}
	/**
	 * Binds or unbinds touch or mouse events on carousels.
	 *
	 * @param {object} $carousel jQuery object of all the breakpoint carousel
	 * @param {string} updateType bind or unbind
	 * @return {void}
	 */
	function updateEvents($carousel, updateType) {
		if (os.isCompatible()) {
			var startEvent = (isTouch) ? 'touchstart' : 'mousedown',
				moveEvent = (isTouch) ? 'touchmove' : 'mousemove',
				endEvent = (isTouch) ? 'touchend' : 'mouseup';

				$carousel[updateType](startEvent + JQUERY_NAMESPACE, onStartEvent);
				$carousel[updateType](moveEvent + JQUERY_NAMESPACE, onMoveEvent);
				$carousel[updateType](endEvent + JQUERY_NAMESPACE, onEndEvent);
				$carousel[updateType]('touchcancel' + JQUERY_NAMESPACE, onEndEvent);
				$carousel[updateType]('mouseleave' + JQUERY_NAMESPACE, onEndEvent);
		}

		$carousel.find(NAV_SELECTOR).find('a')
			[updateType]('click' + JQUERY_NAMESPACE, onNavClick)
			[updateType]('keyup' + JQUERY_NAMESPACE, onNavKeyup)
			[updateType]('mouseenter' + JQUERY_NAMESPACE, fixIe8Background)
			[updateType]('mouseleave' + JQUERY_NAMESPACE, fixIe8Background);
		$carousel.find(PAGINATION_SELECTOR).find('a')
			[updateType]('click' + JQUERY_NAMESPACE, onPaginationClick)
			[updateType]('keyup' + JQUERY_NAMESPACE, onNavKeyup);
	}
	/**
	 * Sets the width of the carousel inner and slides and positions
	 *
	 * @return {void}
	 */
	function buildCarousel() {
		var $this = $(this),
			$slides = getBreakpointSlides($this),
			$slideActive = getSlideActive($slides);

		var slidesShown = getSlidesShown($this),
			slideCount = $slides.length,
			slideCountWithSpacing = slideCount + CAROUSEL_SPACING_SLIDES,
			slideWidth = (100 / slideCountWithSpacing) + '%',
			carouselInnerWidth = (slideCountWithSpacing / slidesShown * 100) + '%',
			slideActiveIndex = $slides.index($slideActive);

		$slides.outerWidth(slideWidth);
		$this
			.addClass(DRAGGABLE_CLASS)
			.find(CAROUSEL_INNER_SELECTOR)
				.outerWidth(carouselInnerWidth);

		if (slideCount == 1) {
			return;
		}

		buildNav($this);
		buildPagination($this, slideCount, slidesShown);

		setCarouselMoveGlobalVars($this);
		moveCarousel($this, slideActiveIndex);
		updateEvents($this, 'bind');
	}
	/**
	 * Get the breakpoint carousel slides for a given carousel.
	 *
	 * @param {object} $carousel jQuery object for a carousel
	 * @return {object} jQuery object containing current breakpoint slide for a carousels
	 */
	function getBreakpointSlides($carousel) {
		var currentBreakpointClassSuffix = '';

		for (var breakpoint in breakpointsSupported) {
			if (breakpoints.is(breakpoint)) {
				currentBreakpointClassSuffix = '-' + breakpoint;

				break;
			}
		}

		return $carousel.find(SLIDE_SELECTOR + currentBreakpointClassSuffix).not(SLIDE_HIDDEN_SELECTOR);
	}
	/**
	 * Gets the slide with the _active class finds the first breakpoint slide
	 * that is its parent or child. If not present, defaults to the first slide.
	 *
	 * @param {object} $slides jQuery object for a carousel slides
	 * @return {object} jQuery object containing active slide
	 */
	function getSlideActive($slides) {
		var $slideActive = $slides.filter('.' + SLIDE_ACTIVE_CLASS),
			$slideActiveParent = $slides.filter(slideIsActiveParent),
			$slideActiveChild = $slides.filter(slideIsActiveChild);

		if ($slideActive.length) {
			return $slideActive.first();
		}

		if ($slideActiveParent.length) {
			return $slideActiveParent.first();
		}

		if ($slideActiveChild.length) {
			return $slideActiveChild.first();
		}

		return $slides.first();
	}
	/**
	 * Returns a slide the is the parent of  the _active slide.
	 *
	 * @return {object} jQuery object containing the parent of the active slide
	 */
	function slideIsActiveParent() {
		var $this = $(this);

		if ($this.find('.' + SLIDE_ACTIVE_CLASS).length) {
			return $this;
		}
	}
	/**
	 * Returns a slide the is the child of the _active slide.
	 *
	 * @return {object} jQuery object containing the child of the active slide
	 */
	function slideIsActiveChild() {
		var $this = $(this);

		if ($this.parents(SLIDE_SELECTOR + '.' + SLIDE_ACTIVE_CLASS).length) {
			return $this;
		}
	}
	/**
	 * Gets the number of slides that should be shown for a given carousel at
	 * the current breakpoint.
	 *
	 * @return {int} The numbe of slides to be shown.
	 */
	function getSlidesShown($carousel) {
		for (var breakpoint in breakpointsSupported) {
			if (breakpoints.is(breakpoint)) {
				return $carousel.data(SLIDES_SHOW_DATA_BASE + breakpoint) || 1;
			}
		}
	}
	/**
	 * Builds nav links for a carousel.
	 *
	 * @param {object} $carousel jQuery object for a carousel
	 * @return {void}
	 */
	function buildNav($carousel) {
		$carousel.find(NAV_SELECTOR).html(NAV_LINK_PREV + NAV_LINK_NEXT);
	}
	/**
	 * Builds pagination links for a carousel.
	 *
	 * @param {object} $carousel jQuery object for a carousel
	 * @param {int} slideCount Number of slides in the carousel
	 * @param {int} slidesShown Number of slides shown in the carousel
	 *
	 * @return {void}
	 */
	function buildPagination($carousel, slideCount, slidesShown) {
		var propagationTotal = slideCount - (slidesShown - 1),
			paginationLinks = '';

		for (var i = 0; i < propagationTotal; i++) {
			paginationLinks += PAGINATION_LINK_BASE.replace('{{link_number}}', i + 1);
		}

		var paginationHtml = PAGINATION_BASE
			.replace('{{links}}', paginationLinks)
			.replace('{{link_total}}', propagationTotal);

		$carousel.find(PAGINATION_SELECTOR).html(paginationHtml);
	}
	/**
	 * Sets global vars used in all carousel move events.
	 *
	 * @param {object} $carousel jQuery object for a carousel
	 * @return {void}
	 */
	function setCarouselMoveGlobalVars($carousel) {
		var slidesShown = getSlidesShown($carousel);

		snapInterval = 1 / slidesShown,
		snapIntervalPercent = snapInterval * 100,
		carouselInnerWidthPercent = getCarouselInnerWidthPercent($carousel),
		carouselInnerLeftStartPercent = getCarouselInnerLeftStartPrecent($carousel),
		slideIndexCurrent = getSlideIndexCurrent(carouselInnerWidthPercent, snapIntervalPercent),
		slideIndexMax =getSlideIndexMax($carousel, slidesShown);
	}
	/**
	 * Gets the carousel inner width as a percent of the carousel width.
	 *
	 * @param {object} $carousel jQuery object for a carousel
	 * @return {int} Carousel inner width percent
	 */
	function getCarouselInnerWidthPercent($carousel) {
		var $carouselInner = $carousel.find(CAROUSEL_INNER_SELECTOR);

		return $carouselInner.outerWidth() / $carousel.outerWidth() * 100;
	}
	/**
	 * Gets the starting percent the carousel is set to.
	 *
	 * @param {object} $carousel jQuery object for a carousel
	 * @return {int} Starting percent
	 */
	function getCarouselInnerLeftStartPrecent($carousel) {
		var $carouselInner = $carousel.find(CAROUSEL_INNER_SELECTOR);

		return $carouselInner.position().left / $carousel.outerWidth() * 100;
	}
	/**
	 * Gets the index of the current slide based on the carousel inner left and
	 * the carousel step.
	 *
	 * @param {int} carouselInnerLeftPecent The left position of the carousel inner
	 * @param {int} snapIntervalPercent The incremenet the carousel inner left steps
	 * @return {int} Current carousel slide index
	 */
	function getSlideIndexCurrent(carouselInnerLeftPecent, snapIntervalPercent) {
		return Math.round(-1 * carouselInnerLeftStartPercent / snapIntervalPercent);
	}
	/**
	 * Gets the maximum carousel index accounting for inactive cards
	 *
	 * @param {object} $carousel jQuery object for a carousel
	 * @param {int} slidesShown Number of slides shown in the carousel
	 * @return {int} The maximum carousel index
	 */
	function getSlideIndexMax($carousel, slidesShown) {
		var $breakpointSlides = getBreakpointSlides($carousel),
			$firstInactiveSlide = $breakpointSlides.filter(SLIDE_INACTIVE_SELECTOR).first();

		var slideIndexMax = $breakpointSlides.length - slidesShown,
			lastActiveSlide = $breakpointSlides.index($firstInactiveSlide) - 1;

		return (lastActiveSlide > -1)
			? Math.min(slideIndexMax, lastActiveSlide)
			: slideIndexMax;
	}
	/**
	 * Moves the carsouel to a given slide index.
	 *
	 * @param {object} $carousel jQuery object for a carousel
	 * @param {int} slideIndex The index of the slide to slide to
	 * @param {bool} slideIndexDidNotChange If the slide index did not change
	 * @return {void}
	 */
	function moveCarousel($carousel, slideIndex, slideIndexDidNotChange) {
		var $slides = getBreakpointSlides($carousel);

		var slideIndexRound = Math.round(slideIndex),
			slidesShown = getSlidesShown($carousel),
			slideCount = $slides.length;

		slideIndex = Math.min(slideIndexRound, slideIndexMax),
		slideIndex = Math.max(slideIndex, 0);

		var slidePercent = (slideIndex / slidesShown * -100) + '%';

		var $currentSlideOld = $carousel.find(SLIDE_SELECTOR + '.' + SLIDE_ACTIVE_CLASS),
			$currentSlide = $slides.eq(slideIndex);

		$currentSlideOld.removeClass(SLIDE_ACTIVE_CLASS);
		$currentSlide.addClass(SLIDE_ACTIVE_CLASS);

		$slides
			.find('a')
				.attr('tabindex', '-1');
		$currentSlide
			.find('a')
				.attr('tabindex', '');

		if (!slideIndexDidNotChange) {
			$currentSlideOld.trigger(ON_CARD_EVENT_LEAVE);
			$currentSlide.trigger(ON_CARD_EVENT_ENTER);
		}

		$carousel
			.find(CAROUSEL_INNER_SELECTOR)
				.css('left', slidePercent);

		updateNavActive($carousel, slideIndex, slideIndexMax);
		updatePaginationActive($carousel, slideIndex, slideCount);
	}
	/**
	 * Updates the carousel nav active states for the current active slide.
	 *
	 * @param {object} $carousel jQuery object for a carousel
	 * @param {int} slideIndex The index of the slide to sldie to
	 * @param {int} slideIndexMax The maximum carousel index
	 * @return {void}
	 */
	function updateNavActive($carousel, slideIndex, slideIndexMax) {
		var isFirstSlide = (slideIndex === 0),
			isLastSlide = (slideIndex == slideIndexMax);

		$carousel
			.find('.' + NAV_LINK_DISABLED_CLASS)
				.removeClass(NAV_LINK_DISABLED_CLASS)
				.attr('tabindex', '');

		if (isFirstSlide) {
			$carousel
				.find('.' + NAV_LINK_PREV_CLASS)
					.addClass(NAV_LINK_DISABLED_CLASS)
					.attr('tabindex', '-1');
		} else if (isLastSlide) {
			$carousel
				.find('.' + NAV_LINK_NEXT_CLASS)
					.addClass(NAV_LINK_DISABLED_CLASS)
					.attr('tabindex', '-1');
		}
	}
	/**
	 * Updates the carousel pagination active states for the current active slide.
	 *
	 * @param {object} $carousel jQuery object for a carousel
	 * @param {int} slideIndex The index of the slide to sldie to
	 * @param {int} slideCount The total number of slides in the carousel
	 * @return {void}
	 */
	function updatePaginationActive($carousel, slideIndex, slideCount) {
		var $carouselPaginationLinks = $carousel.find('.' + PAGINATION_LINK_CLASS);

		$carouselPaginationLinks
			.filter('.' + SLIDE_ACTIVE_CLASS)
				.removeClass(SLIDE_ACTIVE_CLASS);

		$carouselPaginationLinks
			.eq(slideIndex)
				.addClass(SLIDE_ACTIVE_CLASS);
	}
	/**
	 * Fires on touchstart or mousedown to update drag start position if it's
	 * not a multi-touch event.
	 *
	 * @param {object} event The touch or mouse event
	 * @return {void}
	 */
	function onStartEvent(event) {
		var $this = $(this),
			$slides = getBreakpointSlides($this);

		if (isValidEvent(event)) {
			dragStartIsLongEnough = true;
			isDragging = true;
			$this.removeClass(DRAGGED_CLASS).addClass(DRAGGING_CLASS);

			setCarouselMoveGlobalVars($this);

			dragStart = getEvent(event).pageX,
			dragPercent = 0,
			dragSpeed = 0,
			dragTime = (new Date()).getTime();
		}

		preventDefaultEvents(event);
	}
	/**
	 * If binding touch events, validates if it is a single-touch event
	 * instead of a multi-touch event.
	 *
	 * @param {object} event The touch or mouse event
	 * @return {bool} Was the event valid?
	 */
	function isValidEvent(event) {
		return (isTouch)
			? (event.originalEvent.touches && event.originalEvent.touches.length == 1)
			: true;
	}
	/**
	 * Returns the mouse event or event.touches for touchstart and
	 * event.changedTouches for touch end since they're different for each event.
	 *
	 * @param {object} event The touch or mouse event
	 * @return {object} Mouse or touch event object.
	 */
	function getEvent(event) {
		if (isTouch) {
			return event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
		} else {
			return event;
		}
	}
	/**
	 * Prevents default mouse events since they will try to move imgs and
	 * prevents default touch events after the minimum drag has been reached.
	 *
	 * @param {object} event The touch or mouse event
	 * @return {void}
	 */
	function preventDefaultEvents(event) {
		if (!isTouch || dragIsMin()) {
			event = (isTouch)
				? event.originalEvent
				: event;

			event.preventDefault();
		}
	}
	/**
	 * Checks if the minimum scroll has been reached. Sets dragStartIsLongEnough to false
	 * if not so the carousel doesn't jump on mobile.
	 *
	 * @return {bool} Drag was long enough
	 */
	function dragIsMin() {
		if (Math.abs(dragPercent) < DRAG_MIN_SCROLL_LOCK) {
			dragStartIsLongEnough = false;
		} else {
			dragStartIsLongEnough = true;
		}

		return dragStartIsLongEnough;
	}
	/**
	 * Binds mouse or touch move and prevents default since images aren't dragged.
	 *
	 * @param {object} event The touch or mouse event
	 * @return {void}
	 */
	function onMoveEvent(event) {
		var $this = $(this);

		if (isDragging) {
			dragCarousel($this, dragStart, getEvent(event).pageX);
			preventDefaultEvents(event);
		}
	}
	/**
	 * Drags slide and prevents default since images aren't dragged.
	 *
	 * @param {object} $carousel jQuery object for a carousel
	 * @param {int} dragStart The starting drag position
	 * @param {int} dragCurrent The current drag position
	 * @return {void}
	 */
	function dragCarousel($carousel, dragStart, dragCurrent) {
		var $carouselInner = $carousel.find(CAROUSEL_INNER_SELECTOR);

		dragPercent = getDragPercent($carousel, dragCurrent, dragStart),
		setDragSpeed();

		var carouselInnerLeftCurrent = carouselInnerLeftStartPercent + dragPercent + '%';

		$carousel
			.find(CAROUSEL_INNER_SELECTOR)
				.css('left', carouselInnerLeftCurrent);
	}
	/**
	 * Sets the current drag speed.
	 *
	 * @return {void}
	 */
	function setDragSpeed() {
		var dragTimeNew = (new Date()).getTime();

		dragSpeed = 130 / (dragTimeNew - dragTime),
		dragTime = dragTimeNew;
	}
	/**
	 * Gets the drag percent and adjusts for resistence on the first and last slide.
	 *
	 * @param {object} $carousel jQuery object for a carousel
	 * @param {int} dragStart The starting drag position
	 * @param {int} dragCurrent The current drag position
	 * @return {int} Drag percent
	 */
	function getDragPercent($carousel, dragCurrent, dragStart) {
		var dragRatio = getDragRatio(dragCurrent, dragStart, $carousel.outerWidth());

		return dragRatio * 100;
	}
	/**
	 * Calculates ratio of drag to carousel width and adds snap resistence at
	 * the intervals and ends of the carousel.
	 *
	 * @param {int} dragCurrent The current drag position
	 * @param {int} dragCurrent The starting drag position
	 * @param {int} carouselWidth The width of the carousel
	 * @return {int} Drag ratio
	 */
	function getDragRatio(dragCurrent, dragStart, carouselWidth) {
		var dragRatio = (dragCurrent - dragStart) / carouselWidth,
			dragDirection = (dragRatio < 0) ? -1 : 1,
			dragRatioAbsolute = Math.abs(dragRatio),
			dragRatioRelativeToSnap = dragRatioAbsolute % snapInterval,
			snapIntervalBase = Math.floor(dragRatioAbsolute / snapInterval) * snapInterval;

		return getDragRatioAdjusted(
			dragRatioRelativeToSnap,
			dragDirection,
			snapIntervalBase
		);
	}
	/**
	 * Gets the drag adjusted for snap points and end points.
	 *
	 * @param {int} dragRatioRelativeToSnap The drag ratio relative to the interval
	 * @param {int} dragDirection The drag direction, psotive or negative
	 * @param {int} snapIntervalBase If we've already passed a snap point, use that as the base
	 * @return {int} Drag ratio adjusted for snap points and end points
	 */
	function getDragRatioAdjusted(dragRatioRelativeToSnap, dragDirection, snapIntervalBase) {
		var dragRatioForInterval = dragRatioRelativeToSnap / snapInterval,
			dragRatioSnapScalar = getDragRatioSnapScalar(dragRatioForInterval),
			dragRatioRelativeToSnapAdjusted = dragRatioRelativeToSnap * dragRatioSnapScalar,
			slideIndexBase = Math.round(snapIntervalBase / snapInterval);

		var isCarouselStart = (slideIndexCurrent - slideIndexBase <= 0),
			draggingBackwards = (dragDirection > 0);

		var isCarouselEnd = (slideIndexCurrent + snapIntervalBase >= slideIndexMax),
			draggingForwards = (dragDirection < 0);

		if (isCarouselStart && draggingBackwards) {
			dragRatioRelativeToSnapAdjusted = dragRatioRelativeToSnapAdjustedForBounds(
				dragRatioForInterval,
				dragRatioRelativeToSnap,
				snapInterval,
				snapIntervalBase
			);
			snapIntervalBase = slideIndexCurrent * snapInterval;
		} else if (isCarouselEnd && draggingForwards) {
			dragRatioRelativeToSnapAdjusted = dragRatioRelativeToSnapAdjustedForBounds(
				dragRatioForInterval,
				dragRatioRelativeToSnap,
				snapInterval,
				snapIntervalBase
			);
			snapIntervalBase = (slideIndexMax - slideIndexCurrent) * snapInterval;
		}

		return dragDirection * (dragRatioRelativeToSnapAdjusted + snapIntervalBase);
	}
	/**
	 * Gets the scalar used to adjust the drag ratio for snaps.
	 *
	 * @param {int} dragRatioForInterval The drag ratio as a ratio of the snap interval
	 * @return {int} Drag ratio snap scalar
	 */
	function getDragRatioSnapScalar(dragRatioForInterval) {
		var snapThreshold = DRAG_RATIO_SNAP_THRESHOLD / 100,
			snapThresholdEnd = 1 - snapThreshold,
			dragRatioSnapScalar = 1;

		if (dragRatioForInterval < snapThreshold) {
			dragRatioSnapScalar = getDragRatioSnapThresholdScalar(
				dragRatioForInterval,
				DRAG_SNAP_RESISTANCE_EXPONENT,
				0,
				snapThreshold
			);
		} else if (dragRatioForInterval > snapThresholdEnd) {
			dragRatioSnapScalar = getDragRatioSnapThresholdScalar(
				dragRatioForInterval,
				DRAG_SNAP_RESISTANCE_EXPONENT,
				1,
				snapThreshold
			);
		}

		return dragRatioSnapScalar;
	}
	/**
	 * Gets the scalar used to create the illusion of snapping. Using
	 * exponential equations, the drag is adjusted so that dragging the cursor
	 * or touch event 1px does not move the carousel 1px. If graphed, these
	 * equations will interect at the snapThreshold and 1 - snapThreshold.
	 *
	 * For 2 or quadratic
	 * y = x
	 * y = 10x^2
	 * y = -10(x-1)^2+1
	 *
	 * For 3 or cubic
	 * y = x
	 * y = 100x^3
	 * y = 100(x-1)^3+1
	 *
	 * (https://www.desmos.com/calculator)
	 *
	 * @param {int} dragRatioForInterval The drag ratio as a ratio of the snap interval
	 * @param {int} n Exponent of the equation
	 * @param {int} snapTo 0 for start. 1 For end.
	 * @param {int} snapThreshold The percent of the drag that should snap as a decimal
	 * @return {int} Drag ratio snap threshold scalar
	 */
	function getDragRatioSnapThresholdScalar(dragRatioForInterval, n, snapTo, snapThreshold) {
		var invertForOddPowersOnSnapEnd = Math.pow((-2 * snapTo + 1), (n - 1)),
			exponetialEquationScale = 1 / Math.pow(snapThreshold, (n - 1)),
			xToTheNAdjustedForSnapThreshold = Math.pow((dragRatioForInterval - snapTo), n),
			dragRatioSnap = invertForOddPowersOnSnapEnd * exponetialEquationScale * xToTheNAdjustedForSnapThreshold + snapTo;

		return dragRatioSnap / dragRatioForInterval || 0;
	}
	/**
	 * Adjusts the drag ratio so that it's half as efficient outsides the bounds
	 * and sets a max for when the snapIntervalBase increases.
	 *
	 * @param {int} dragRatioForInterval The drag ratio as a ratio of the snap interval
	 * @param {int} dragRatioRelativeToSnap The drag ratio relative to the interval
	 * @param {int} snapInterval The interval in which we are dragging
	 * @param {int} snapIntervalBase If we've already passed a snap point, use that as the base
	 * @return {int} The snap ratio adjusted for bounds.
	 */
	function dragRatioRelativeToSnapAdjustedForBounds(dragRatioForInterval, dragRatioRelativeToSnap, snapInterval, snapIntervalBase) {
		var dragRatioBoundsScalar = -.5 * dragRatioForInterval + 1,
			dragRatioTotal = dragRatioRelativeToSnap + snapIntervalBase,
			dragRatioTotalAdjusted = dragRatioBoundsScalar * dragRatioTotal;

		return Math.min(dragRatioTotalAdjusted, snapInterval / 2);
	}
	/**
	 * Checks to see if the drag was long enough and passes the drag percent to
	 * moveCarousel to update the carousel.
	 *
	 * @param {object} event The touch or mouse event
	 * @return {void}
	 */
	function onEndEvent(event) {
		var $this = $(this);

		var wasDragging = isDragging,
			slideIndexDidNotChange = true;

		isDragging = false;
		$this.addClass(DRAGGED_CLASS).removeClass(DRAGGING_CLASS);

		setDragSpeed();

		if (wasDragging) {
			var dragDirection = (dragPercent < 0) ? -1 : 1,
				dragEndMin = snapIntervalPercent / 2,
				dragPercentAbsoluteWidthSpeed = Math.abs(dragPercent) + dragSpeed,
				dragEndIsLongEnough = dragPercentAbsoluteWidthSpeed > dragEndMin;

			if (dragStartIsLongEnough && dragEndIsLongEnough) {
				var dragPercentWithSpeed = dragDirection * dragPercentAbsoluteWidthSpeed,
					slideIndexChange = getSlideIndexChange(dragPercentWithSpeed),
					slideIndexDidNotChange = false;

				slideIndexCurrent = slideIndexCurrent - slideIndexChange;
			}

			moveCarousel($this, slideIndexCurrent, slideIndexDidNotChange);
		}
	}
	/**
	 * Gets the change in the index based on the slide percent.
	 *
	 * @param {int} dragPercent The percent the carousel has moved
	 * @return {int} The change in the index
	 */
	function getSlideIndexChange(dragPercent) {
		var dragDirection = (dragPercent < 0) ? -1 : 1,
			dragPercentAbsolute = Math.abs(dragPercent),
			slideIndexUnroudned = dragPercentAbsolute / snapIntervalPercent,
			slideIndexOffset = Math.round(slideIndexUnroudned),
			slideIndexOffsetMin = Math.max(slideIndexOffset, 1),
			slideIndexChange = dragDirection * slideIndexOffsetMin;

		return slideIndexChange;
	}
	/**
	 * Moves the carousel forward or backwards one slide and sets disabled
	 * classes when the at the start or end.
	 *
	 * @param {object} event Click event
	 * @return {void}
	 */
	function onNavClick(event) {
		var $this = $(this),
			$carousel = $this.parents(CAROUSEL_SELECTOR);

		if (!$this.hasClass(NAV_LINK_DISABLED_CLASS)) {
			var isPrevClick = $this.hasClass(NAV_LINK_PREV_CLASS),
				slideIndexOffset = (isPrevClick) ? -1 : 1;

			setCarouselMoveGlobalVars($carousel);
			moveCarousel($carousel, slideIndexCurrent + slideIndexOffset);
		}

		preventDefault(event);
	}
	/**
	 * Prevents the default click event if it was triggered by a click.
	 *
	 * @param {object} event Click event
	 * @return {void}
	 */
	function preventDefault(event) {
		if (event && event.preventDefault) {
			event.preventDefault();
		}
	}
	/**
	 * Advances the carousel to the index of the link clicked.
	 *
	 * @param {object} event Click event
	 * @return {void}
	 */
	function onPaginationClick(event) {
		var $this = $(this),
			$carousel = $this.parents(CAROUSEL_SELECTOR);

		var slideIndexHtml = $this.find('.' + PAGINATION_LINK_INDEX_CLASS).html(),
			slideIndex = parseInt(slideIndexHtml) - 1;

		setCarouselMoveGlobalVars($carousel);
		moveCarousel($carousel, slideIndex);

		preventDefault(event);
	}
	/**
	 * Handles keyup events for accessibility.
	 *
	 * @param {object} event The touch or mouse event
	 * @return {void}
	 */
	function onNavKeyup(event) {
		var $this = $(this),
			$carousel = $this.parents(CAROUSEL_SELECTOR);

		if (isEnterKey(event)) {
			$carousel
				.find(SLIDE_SELECTOR + '.' + SLIDE_ACTIVE_CLASS)
					.attr('tabindex', '-1')
					.focus();
		}
	}
	/**
	 * Determines if a key event is the enter key
	 *
	 * @param {object} event The touch or mouse event
	 * @return {bool} Was it the enter key
	 */
	function isEnterKey(event) {
		return (event.which === 13);
	}
	/**
	 * Toggles an inactive class to fix the hover bug in IE8 where the hover
	 * class sticks after a menu is closed.
	 *
	 * @return {void}
	 */
	function fixIe8Background() {
		var $this = $(this);

		$this.toggleClass(IE8_INACTIVE_CLASS);
	}
	/**
	 * Adds an event that is fired when a card becomes active on inactive.
	 *
	 * @param {object} $card jQuery object containging the card or cards selector
	 * @param {function} callback The function to fired when the card becomes active
	 * @param {string} cardEvent The enter or leave event name
	 * @return {void}
	 */
	function onCardEvent($card, callback, cardEvent) {
		if ($.isFunction(callback)) {
			$card.bind(cardEvent, callback);
		}
	}

	return {
		/**
		 * Public load function for main.js. Binds all carousels.
		 *
		 * @return {void}
		 */
		load: function() {
			buildCarousels();
			breakpoints.change(rebuildCarousels);
		},
		/**
		 * Rebuilds all carousels.
		 *
		 * @return {void}
		 */
		rebuild: buildCarousels,
		/**
		 * Makes a card active.
		 *
		 * @param {object} $carousel jQuery object containging the carousel
		 * @return {void}
		 */
		update: function($carousel) {
			setCarouselMoveGlobalVars($carousel);
			updateNavActive($carousel, slideIndexCurrent, slideIndexMax);
			updatePaginationActive($carousel, slideIndexCurrent, getBreakpointSlides($carousel).length);
		},
		/**
		 * Makes a card active.
		 *
		 * @param {object} $card jQuery object containging the card
		 * @return {void}
		 */
		setActive: function($card) {
			var $carousel = $card.parents(CAROUSEL_SELECTOR),
				$slides = getBreakpointSlides($carousel);

			var slideIndex = $slides.index($card);

			setCarouselMoveGlobalVars($carousel);
			moveCarousel($carousel, slideIndex);
		},
		/**
		 * Adds an event that is fired when a card becomes active.
		 *
		 * @param {object} $card jQuery object containging the card or cards selector
		 * @param {function} callback The function to fired when the card becomes active
		 * @return {void}
		 */
		onCardEnter: function($card, callback) {
			onCardEvent($card, callback, ON_CARD_EVENT_ENTER);
		},
		/**
		 * Adds an event that is fired when a card loses active state.
		 *
		 * @param {object} $card jQuery object containging the card or cards selector
		 * @param {function} callback The function to fired when the card loses active state
		 * @return {void}
		 */
		onCardLeave: function($card, callback) {
			onCardEvent($card, callback, ON_CARD_EVENT_LEAVE);
		}
	};
});