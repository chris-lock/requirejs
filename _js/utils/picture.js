'use strict';

/**
 * Calls picturefill on initial load and AJAX loads.
 *
 * @author Chris Lock
 *
 * @param {object} Loader Loader utility.
 * @param {object} picturefill Picturefill library.
 * @return {void}
 */
define(['Loader', 'picturefill'], function(Loader, picturefill) {
	/**
	 * Calls picturefill and registers it as a utility load method.
	 *
	 * @return {void}
	 */
	function load() {
		Loader.registerUtilMethod(picturefill);
		picturefill();
	}
	/**
	 * All utils should load themselves.
	 */
	load();
});