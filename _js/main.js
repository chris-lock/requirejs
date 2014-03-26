/**
 * This is the config object for RequireJS. Paths are grouped libs, utils, and
 * modules and alphabetized. urlArgs is used to prevent browser caching in dev.
 *
 * @author Chris Lock
 *
 * @see	http://requirejs.org/
 */
requirejs.config({
	baseUrl: '/_js',
	paths: {
		// libs
		async: 'libs/async',
		jquery: 'libs/jquery/jquery-1.10.2.min',

		// utils
		breakpoints: 'utils/breakpoints',
		cookies: 'utils/cookies',
		dispatcher: 'utils/dispatcher',
		// geolocation: 'utils/geolocation',
		// googleMaps: 'utils/google-maps',
		// googleMapsApi: 'utils/google-maps-api',
		imageLoader: 'utils/image-loader',
		nthChild: 'utils/nth-child',
		os: 'utils/os',
		viewport: 'utils/viewport',
		youtube: 'utils/youtube',

		// modules
		carousel: 'modules/carousel',
	},
	urlArgs: (new Date()).getTime()
});

/**
 * This loads all modules base on the data-modules attribute. While it would be
 * ideal to have this in a module, having it here reduces one HTTP request. All
 * site wide utils shuld be included in the define call.
 *
 * @author Chris Lock
 *
 * @param {object} jquery jQuery library.
 * @return {void}
 */
define(['breakpoints', 'cookies', 'dispatcher', 'imageLoader', 'nthChild', 'viewport', 'youtube'], function(breakpoints, cookies, dispatcher, imageLoader, nthChild, viewport, youtube) {
		/** @type {constant} The module data attribute. */
	var MODULE_DATA = 'data-module';

		/** @type {bool} $(document).ready equivalent has fired. */
	var documentReadyHasBeenTrigger = false,
		/** @type {bool} document.onreadystatechange has fired. */
		documentCompleteHasBeenTrigger = false,
		/** @type {object} Object containg all modules DOM elements. */
		modules = document.querySelectorAll('[' + MODULE_DATA + ']'),
		/** @type {object} The unique modules requested on the page. */
		uniqueModules = {};

	/**
	 * Fire modules' public load method when document is ready. Taken from the 
	 * jQuery ready method.
	 *
	 * @author John Resig
	 * @copyright 2010, John Resig
	 * @license http://jquery.org/license Dual licensed under the MIT or GPL Version 2 licenses.
	 *
	 * @return {void}
	 */
	/**
	 * Catch cases where $(document).ready() is called after the browser event 
	 * has already occurred.
	 */
	if (document.readyState === "complete")
		/**
		 * Handle it asynchronously to allow scripts the opportunity to delay 
		 * ready.
		 */
		setTimeout(documentReady, 1);
	/**
	 * Mozilla, Opera and webkit nightlies currently support this event.
	 */
	if (document.addEventListener) {
		/**
		 * Use the handy event callback.
		 */
		document.addEventListener("DOMContentLoaded", DOMContentLoaded, false);
		/**
		 * A fallback to window.onload that will always work.
		 */
		window.addEventListener("load", documentReady, false);
	/**
	 * If IE event model is used.
	 */
	} else if (document.attachEvent) {
		/**
		 * Ensure firing before onload, maybe late but safe also for iframes.
		 */
		document.attachEvent("onreadystatechange", DOMContentLoaded);
		/**
		 * A fallback to window.onload, that will always work.
		 */
		window.attachEvent("onload", documentReady);
	}
	/**
	 * Cleanup functions for the document ready method attached in the 
	 * bindReady handler.
	 *
	 * @author John Resig
	 * @copyright 2010, John Resig
	 * @license http://jquery.org/license Dual licensed under the MIT or GPL Version 2 licenses.
	 *
	 * @return {void}
	 */
	function DOMContentLoaded() {
		if (document.addEventListener)
			document.removeEventListener("DOMContentLoaded", DOMContentLoaded, false);
		else if (document.attachEvent && document.readyState === "complete" )
			document.detachEvent("onreadystatechange", DOMContentLoaded);

		documentReady();
	}
	/**
	 * Gets all unique requested modules and fires their public load method.
	 * Then calls documentComplete to ensure it fires after since in IE8
	 * document.onreadystatechange fires before.
	 *
	 * @return {void}
	 */
	function documentReady() {
		documentReadyHasBeenTrigger = true;
		uniqueModules = getUniqueModules();

		fireModuleMethods('load');
		documentComplete();
	}
	/**
	 * Gets all uniique modules requested on the page.
	 *
	 * @return {object} Unique modules.
	 */
	function getUniqueModules() {
		var uniqueModules = {},
			requestedModules = getRequestedModules();

		for (var i = requestedModules.length - 1; i > -1; i--)
			uniqueModules[requestedModules[i]] = true;

		return uniqueModules;
	}
	/**
	 * Gets all requested modules requested on the page.
	 *
	 * @return {array} All requested modules
	 */
	function getRequestedModules() {
		var requestedModules = [];

		for (var i = modules.length - 1; i > -1; i--)
			requestedModules = requestedModules.concat(
				parseModuleString(
					modules[i].getAttribute(MODULE_DATA)
				)
			);

		return requestedModules;
	}
	/**
	 * Parse the data-module value as an array.
	 *
	 * @param {string} moduleString Comma delimited string
	 * @return {array} The requested modules
	 */
	function parseModuleString(moduleString) {
		return moduleString.split(' ').join('').split(',');
	}
	/**
	 * Fires a method on all modules.
	 *
	 * @param {string} method The method to fire for all modules
	 * @return {void}
	 */
	function fireModuleMethods(method) {
		if (uniqueModules)
			for (var module in uniqueModules)
				require([module], function(module) {
					fireModuleMethod(module, method);
				});
	}
	/**
	 * Ensures the method is available before firing.
	 *
	 * @param {object} module The module to call the method on
	 * @param {string} method The method to fire for all modules
	 * @return {void}
	 */
	function fireModuleMethod(module, method) {
		if (isFunction(module[method]))
			module[method]();
	}
	/**
	 * Checks if a variable is a function.
	 *
	 * @param {function} functionToCheck The module to call the method on
	 * @return {bool} Is it a function
	 */
	function isFunction(functionToCheck) {
		var getType = {};

		return (functionToCheck && getType.toString.call(functionToCheck) === '[object Function]');
	}
	/**
	 * Fires documentComplete method on modules. This event occurs after
	 * font-face has been loaded.
	 *
	 * @return {void}
	 */
	function documentComplete() {
		if (documentReadyHasBeenTrigger && !documentCompleteHasBeenTrigger && document.readyState === 'complete') {
			fireModuleMethods('documentComplete');

			documentCompleteHasBeenTrigger = true;
		}
	}
	/**
	 * Fires documentComplete method on modules. This event occurs after
	 * font-face has been loaded.
	 */
	document.onreadystatechange = documentComplete;
});