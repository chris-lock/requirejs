'use strict';

/**
 * Fixes input focus on touch devices from breaking position: fixed; elements.
 *
 * @author Chris Lock
 *
 * @param {object} jquery jQuery library.
 * @return {void}
 */
define(['jquery', 'Viewport', 'Browser'], function($, Viewport, Browser) {
		/** @type {object} The HTML element */
	var	$html = $('html'),
		/** @type {object} All form elements on the page that take focus on iOS. */
		$focusableElements = $('input, textarea, select');

	/**
	 * Prevents touch scrolling when inputs are focused so you can't see that
	 * position fixed is broken on iOS, and blurs inputs on orientation change.
	 *
	 * @return {void}
	 */
	function load() {
		$focusableElements
			.on('focus', addInputFocusedFix)
			.on('blur', removeInputFocusedFix);
		$html.on('touchend', blurInputIfFocused);

		if (Browser.supportsTouch()) {
			Viewport.resize(blurInputs);
		}
	}
	/**
	 * On mobile devicecs, focusing an form elements breaks position fixed
	 * elements so we prevent touch scrolling so you can't see it.
	 *
	 * @return {void}
	 */
	function addInputFocusedFix() {
		Viewport.preventTouchScroll(true);
	}
	/**
	 * Allows touch scrolling on blur.
	 *
	 * @return {void}
	 */
	function removeInputFocusedFix() {
		Viewport.preventTouchScroll(false);
	}
	/**
	 * Blurs a focusable element on off touch.
	 *
	 * @return {void}
	 */
	function blurInputIfFocused() {
		var $focused = $focusableElements.filter($(document.activeElement)),
			$elem = $(this);

		if ($focused.length && !$focused.is($elem)) {
			$focused.blur();
		}
	}
	/**
	 * For touch, closes blurs inputs on orientation change since they break
	 * fixed elements.
	 *
	 * @return {void}
	 */
	function blurInputs() {
		$focusableElements.blur();
	}
	/**
	 * All utils should load themselves.
	 */
	load();
});