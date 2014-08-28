'use strict';

/**
 * Forces an element to repaint
 *
 * @author Chris Lock
 *
 * @param {object} jquery jQuery library.
 * @param {object} os OS utility.
 * @param {object} viewport Viewport utility.
 * @return {object} Public methods.
 */
define(['jquery', 'os', 'viewport'], function($, os, viewport) {
		/** @type {object} jQuery object containing the items for repaint on height change. */
	var $repaintElementsHeight = $('.force-repaint-height'),
		/** @type {object} jQuery object containing the items for repaint on width change. */
		$repaintElementsWidth = $('.force-repaint-width');

	/**
	 * Load function for the utility.
	 *
	 * @return {void}
	 */
	function load() {
		if (!os.isCompatible()) {
			viewport.resizeHeight(function() {
				repaint($repaintElementsHeight);
			});
			viewport.resizeWidth(function() {
				repaint($repaintElementsWidth);
			});
		}
	}
	/**
	 * Forces an element to repaint by changing it's display and requesting it's
	 * height.
	 *
	 * @see http://stackoverflow.com/a/12292266
	 *
	 * @param {object} $element jQuery object of elements to repaint
	 * @return {void}
	 */
	function repaint($element) {
		$element
			.css('display', 'table')
			.height();
		$element.css('display', '');
	}

	/**
	 * All utils should load themselves.
	 */
	load();

	return {
		/**
		 * Public load function for force-repaint.js
		 *
		 * @return {void}
		 */
		load: load,
		/**
		 * Public repaint function.
		 *
		 * @param {object} $element jQuery object of elements to repaint
		 * @return {void}
		 */
		repaint: function($element) {
			repaint($element);
		}
	};
});
