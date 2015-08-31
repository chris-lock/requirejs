'use strict';

/**
 * Updates a body class for portrait and landscape orientation.
 *
 * @author Chris Lock
 *
 * @param {object} jquery jQuery library.
 * @param {object} Viewport Viewport utility.
 * @return {object} Public methods.
 */
define(['jquery', 'Viewport'], function($, Viewport) {
	var LANDSCAPE_CLASS = '_viewport-landscape',
		PORTRAIT_CLASS = '_viewport-portrait';

	var $html = $('html');

	function load() {
		updateOrientationClass(Viewport.get());
		Viewport.resize(updateOrientationClass);
	}

	function updateOrientationClass(viewport) {
		var classToAdd = PORTRAIT_CLASS,
			classToRemove = LANDSCAPE_CLASS;

		if (viewport.width > viewport.height) {
			classToAdd = LANDSCAPE_CLASS;
			classToRemove = PORTRAIT_CLASS;
		}

		if (!$html.hasClass(classToAdd)) {
			$html
				.addClass(classToAdd)
				.removeClass(classToRemove);
		}
	}

	load();
});