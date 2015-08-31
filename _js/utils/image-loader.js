'use strict';

/**
 * Loads images based on the starting breakpoint for div's or img's
 *
 * 		<div
 * 			data-src="The API basepoint accepting a url formatted [ImageApiEndpoint.jpg]?w=[width]&h=[height]"
 *			data-src_standard="The standard background image API basepoint with URL parameters to size it in half"
 *			data-src_standard_retina="The standard background image API basepoint"
 *			data-src_medium="The medium background image API basepoint with URL parameters to size it in half""
 *			data-src_medium_retina="The medium background image API basepoint""
 *			data-src_small="The standard background image API basepoint with URL parameters to size it in half"
 *			data-src_small_retina="The standard background image API basepoint"
 * 		></div>
 *
 * 		<div
 *			data-src="[BackgroundSmallImageApiEndpoint.jpg]?w=/768&amp;h=221"
 *			data-src_standard="[BackgroundStandardImageApiEndpoint.jpg]?w=1600&amp;h=445"
 *			data-src_standard_retina="[BackgroundStandardImageApiEndpoint.jpg]"
 *			data-src_medium="[BackgroundMediumImageApiEndpoint.jpg]?w=1000&amp;h=445"
 *			data-src_medium_retina="[BackgroundMediumImageApiEndpoint.jpg]"
 *			data-src_small="[BackgroundSmallImageApiEndpoint.jpg]?w=/768&amp;h=221"
 *			data-src_small_retina="[BackgroundSmallImageApiEndpoint.jpg]"
 *		></div>
 *
 * Img's can be loaded using the above method or
 *
 * 		<img
 * 			alt="Image Alt"
 * 			data-height="non-retina standard height"
 * 			data-src="The API basepoint accepting a url formatted [ImageApiEndpoint.jpg]?w=[width]&h=[height]"
 * 			data-width="non-retina standard width"
 * 			data-width_medium="non-retina medium width"
 * 			data-width_small="non-retina small width"
 * 			src="holder image or low quality image"
 * 		/>
 *
 * 		<img
 *			alt="Picture of Michelle A. Book"
 *			data-height="93"
 *			data-src="[ImageApiEndpoint.jpg]"
 *			data-width="93"
 *			data-width_medium="93"
 *			data-width_small="50"
 *			src="[ImageApiEndpoint.jpg]?w=50&amp;h=50"
 *		/>
 *
 * @author Chris Lock
 *
 * @param {object} jquery jQuery library.
 * @param {object} Breakpoints Breakpoints utility.
 * @param {object} Loader Loader utility.
 * @return {object} Public methods.
 */
define(['jquery', 'Breakpoints', 'Loader'], function($, Breakpoints, Loader) {
		/** @constant The data tag for image loading. */
	var	DATA_SRC = 'data-src',
		/** @constant The defult image width data attr. */
		DATA_WIDTH = 'data-width',
		/** @constant The base used for the breakpoint image width data attr. */
		DATA_WIDTH_BREAKPOINT_BASE = DATA_WIDTH + '_',
		/** @constant The defult image height data attr. */
		DATA_HEIGHT = 'data-height',
		/** @constant The base used for the breakpoint image height data attr. */
		DATA_HEIGHT_BREAKPOINT_BASE = DATA_HEIGHT + '_',
		/** @constant The base used for the new image url. */
		URL_BASE = '[src][query]',
		/** @constant The base used for the new image width url parameter. */
		URL_WIDTH_BASE = 'w=[width]',
		/** @constant The base used for the new image height url parameter. */
		URL_HEIGHT_BASE = 'h=[height]',
		/** @constant The base for image loading. */
		DATA_SRC_BASE = DATA_SRC + '_',
		/** @constant The base for retina images. */
		DATA_SRC_RETINA_BASE = '_retina',
		/** @constant The class added once loaded. */
		LOADED_CLASS = '_loaded',
		/** @constant The selector of loaded elements. */
		LOADED_SELECTOR = '.' + LOADED_CLASS;

		/** @type {object} Breakpoints supported. */
	var breakpointsSupported = {
			'standard': true,
			'medium': true,
			'small': true
		},
		/** @type {string} The current breakpoint. */
		breakpointCurrent = '';

	/**
	 * Registers the util method with the Loader and loads the images for all
	 * elements.
	 *
	 * @return {void}
	 */
	function load() {
		breakpointCurrent = getBreakpointCurrent();

		Loader.registerUtilMethod(loadImages);
		loadImages();
		Breakpoints.change(updateImages);
	}
	/**
	 * Get the current breakpoint.
	 *
	 * @return {string} The current breakpoint
	 */
	function getBreakpointCurrent() {
		for (var breakpoint in breakpointsSupported) {
			if (Breakpoints.is(breakpoint)) {
				return breakpoint;
			}
		}

		return '';
	}
	/**
	 * Loads only elements that haven't been loaded before.
	 *
	 * @param {object} $element The element to look inside for images that need loading
	 * @return {void}
	 */
	function loadImages($element) {
		getImages($element).not(LOADED_SELECTOR).each(loadImg);
		getBgImages($element).not(LOADED_SELECTOR).each(loadBgImage);
	}
	/**
	 * Gets all the images from the current DOM.
	 *
	 * @param {object} $element The element to look inside for images that need loading
	 * @return {object} Images in the page.
	 */
	function getImages($element) {
		return getElements($element).filter('img');
	}
	/**
	 * Gets all the elements with the data tag from the current DOM. Addback
	 * includes the parent in case it has a data-src attribute as well.
	 *
	 * @param {object} $element The element to look inside for images that need loading
	 * @return {object} Elements in the page.
	 */
	function getElements($element) {
		var $parent = $element || $(document);

		var dataSrcSelector = '[' + DATA_SRC + ']';

		return $parent.find(dataSrcSelector).addBack(dataSrcSelector);
	}
	/**
	 * Gets all the background image elements from the current DOM.
	 *
	 * @param {object} $element The element to look inside for background images that need loading
	 * @return {object} Background image elements in the page.
	 */
	function getBgImages($element) {
		return getElements($element).not('img');
	}
	/**
	 * Updates all elements.
	 *
	 * @return {void}
	 */
	function updateImages() {
		breakpointCurrent = getBreakpointCurrent();

		getImages().each(loadImg);
		getBgImages().each(loadBgImage);
	}
	/**
	 * Loads the images for all img tags.
	 *
	 * @return {void}
	 */
	function loadImg() {
		var $this = $(this);

		var src = getImageUrl($this);

		if (!src) {
			return;
		}

		var imgObj = getImgObj($this),
			queryStartingChar = getImgUrlQueryStartingChar(src),
			url = getImgUrl(src, queryStartingChar, imgObj.width, imgObj.height);

		$this.attr('src', url);
		updateClasses($this);
	}
	/**
	 * Updates the loaded class that can be used for animations.
	 *
	 * @param {object} $this jQuery object containg the element
	 * @return {void}
	 */
	function updateClasses($this) {
		$this
			.removeClass(LOADED_CLASS)
			.addClass(LOADED_CLASS);
	}
	/**
	 * Gets the url for the image from the src data atribute of the breakpoint
	 * src data attribute.
	 *
	 * @param {object} $this jQuery object containg the element
	 * @return {string} The image url
	 */
	function getImageUrl($this) {
		var defaultImageUrl = $this.attr(DATA_SRC),
			breakpointImageUrlDataAttr = DATA_SRC_BASE + getBreakpointCurrent();

		if (Breakpoints.is('retina')) {
			defaultImageUrl = $this.attr(breakpointImageUrlDataAttr) || defaultImageUrl;
			breakpointImageUrlDataAttr += DATA_SRC_RETINA_BASE;
		}

		return $this.attr(breakpointImageUrlDataAttr) || defaultImageUrl;
	}
	/**
	 * Gets an object with default and breakpoint specific width and heights
	 *
	 * @param {object} $this jQuery object containg the element
	 * @return {object} The image object
	 */
	function getImgObj($this) {
		var imgObj = {
				widthBreakpoint: 0,
				widthDefault: 0,
				width: 0,
				heightBreakpoint: 0,
				heightDefault: 0,
				height: 0,
				ratio: 0,
			};

		setImgWidth(imgObj, $this);
		setImgHeightDefaults(imgObj, $this);
		setImgRatio(imgObj);
		setImgHeight(imgObj);

		return imgObj;
	}
	/**
	 * Sets the image default and breakpoint specific width. The final width
	 * will be the breakpoint specific width if present, then the default width,
	 * then 0.
	 *
	 * @param {object} The image object
	 * @param {object} $this jQuery object containg the element
	 * @return {object} The image object with width parameters
	 */
	function setImgWidth(imgObj, $this) {
		var	widthBreakpointAttr = DATA_WIDTH_BREAKPOINT_BASE + breakpointCurrent,
			widthBreakpoint = $this.attr(widthBreakpointAttr),
			widthDefault = $this.attr(DATA_WIDTH),
			width = widthBreakpoint || widthDefault || 0,
			resolution = (Breakpoints.is('retina')) ? 2 : 1;

		imgObj.widthBreakpoint = widthBreakpoint;
		imgObj.widthDefault = widthDefault;
		imgObj.width = parseInt(width) * resolution;

		return imgObj;
	}
	/**
	 * Sets the image default and breakpoint specific height.
	 *
	 * @param {object} The image object
	 * @param {object} $this jQuery object containg the element
	 * @return {object} The image object with height parameters
	 */
	function setImgHeightDefaults(imgObj, $this) {
		var	heightBreakpointAttr = DATA_HEIGHT_BREAKPOINT_BASE + breakpointCurrent,
			heightBreakpoint = $this.attr(heightBreakpointAttr),
			heightDefault = $this.attr(DATA_HEIGHT);

		imgObj.heightBreakpoint = heightBreakpoint;
		imgObj.heightDefault = heightDefault;

		return imgObj;
	}
	/**
	 * Sets the image ratio first checking to see if one is specified for the
	 * breakpoint, then checking for the default.
	 *
	 * @param {object} The image object
	 * @return {object} The image object with ratio parameter
	 */
	function setImgRatio(imgObj) {
		if (imgObj.widthBreakpoint && imgObj.heightBreakpoint) {
			imgObj.ratio = imgObj.widthBreakpoint / imgObj.heightBreakpoint;
		} else if (imgObj.widthDefault && imgObj.heightDefault) {
			imgObj.ratio = imgObj.widthDefault / imgObj.heightDefault;
		}

		return imgObj;
	}
	/**
	 * Sets the image height based on the aspect ratio.
	 *
	 * @param {object} The image object
	 * @return {object} The image object with width parameters
	 */
	function setImgHeight(imgObj) {
		var imgWidth = imgObj.widthBreakpoint || imgObj.width;

		if (imgObj.ratio && imgWidth) {
			imgObj.height = Math.round(imgWidth / imgObj.ratio);
		}

		return imgObj;
	}
	/**
	 * Determines if the url already contains a query parameter.
	 *
	 * @param {string} src The src base
	 * @return {string} A question mark or ampersand depending on if we're appending an existing query
	 */
	function getImgUrlQueryStartingChar(src) {
		return (src.indexOf('?') === -1) ? '?' : '&';
	}
	/**
	 * Gets the final url for the image.
	 *
	 * @param {string} src The src base
	 * @param {string} queryStartingChar A question mark or ampersand depending on if we're appending an existing query
	 * @param {string} width The image width
	 * @param {string} height The image height
	 * @return {string} The url for the image
	 */
	function getImgUrl(src, queryStartingChar, width, height) {
		if (width) {
			src = src.replace('[width]', width);
		}

		if (height) {
			src = src.replace('[height]', height);
		}

		return URL_BASE
			.replace('[src]', src)
			.replace('[query]', getUrlQueryString(queryStartingChar, width, height));
	}
	/**
	 * Gets the query string for the url for the image leaving parameters set to 0 blank.
	 *
	 * @param {string} queryStartingChar A question mark or ampersand depending on if we're appending an existing query
	 * @param {string} width The image width
	 * @param {string} height The image height
	 * @return {string} The query string for the url
	 */
	function getUrlQueryString(queryStartingChar, width, height) {
		var queryParameters = [],
			query = '';

		if (width) {
			var urlWidthParameter = URL_WIDTH_BASE.replace('[width]', width);

			queryParameters.push(urlWidthParameter);
		}

		if (height) {
			var urlHeightParameter = URL_HEIGHT_BASE.replace('[height]', height);

			queryParameters.push(urlHeightParameter);
		}

		if (queryParameters.length) {
			query = queryStartingChar + queryParameters.join('&');
		}

		return query;
	}
	/**
	 * Loads the bg images for all elements.
	 *
	 * @return {void}
	 */
	function loadBgImage() {
		var $this = $(this);

		$this.css('background-image', 'url(' + getImageUrl($this) + ')');
		updateClasses($this);
	}
	/**
	 * All utils should load themselves.
	 */
	load();

	return {
		/**
		 * Making the load function public for ajax
		 *
		 * @return {void}
		 */
		load: loadImages
	};
});