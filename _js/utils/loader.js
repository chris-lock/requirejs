'use strict';

/**
 * This loads all modules base on the data-module attribute. The value should be
 * their RequireJS path name. All modules must have a public load method and
 * can have an optional documentComplete that fires after font-face has loaded.
 * While this in main.js reduces one HTTP request, we need to load modules
 * after a. All site wide utils should be included in the define call.
 *
 * @author Chris Lock
 *
 * @param {object} jquery jQuery library.
 * @return {void}
 */
define(['jquery', 'dispatcher'], function($, dispatcher) {
		/** @type {constant} The data attribute for modules. */
	var DATA_MODULE = 'data-module',
		/** @type {constant} The selector for load links. */
		LOADER_LINK_SELECTOR = '.loader-link',
		/** @type {constant} The data attribute the container id to load ajax into. */
		DATA_LOAD_CONTAINER = 'data-load_container',
		/** @type {constant} The class added when ajax is loading. */
		LOADING_CLASS = '_loading',
		/** @type {constant} The class added when ajax is loaded. */
		LOADED_CLASS = '_loaded',
		/** @type {constant} The class added when ajax has an error. */
		ERROR_CLASS = '_loading';

		/** @type {bool} $(document).ready has fired. */
	var documentReadyHasBeenTrigger = false,
		/** @type {bool} document.onreadystatechange has fired. */
		documentCompleteHasBeenTrigger = false,
		/** @type {object} The unique modules requested on the page. */
		uniqueModules = {},
		/** @type {object} The util methods that should be called on ajax load. */
		utilMethods = [];

	/**
	 * Fire modules' public load method when document is ready and fires
	 * modules' public documentComplete method when document is complete. This
	 * event occurs after font-face has been loaded.
	 */
	function load() {
		$(document).ready(documentReady);
		document.onreadystatechange = documentComplete;
		$(LOADER_LINK_SELECTOR).on('click', handleLoaderLinkClick);
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
		uniqueModules = getUniqueModules($(document));

		fireModuleMethods('load');
		documentComplete();
	}
	/**
	 * Gets all unique modules requested inside the element.
	 *
	 * @param {object} $element The element to get the modules for.
	 * @return {object} Unique modules.
	 */
	function getUniqueModules($element) {
		var uniqueModules = {},
			requestedModules = getRequestedModules($element);

		for (var i = requestedModules.length - 1; i > -1; i--) {
			uniqueModules[requestedModules[i]] = true;
		}

		return uniqueModules;
	}
	/**
	 * Gets all requested modules requested on the page. Addback includes the
	 * parent incase it has a data-module attribute as well.
	 *
	 * @param {object} $element The element to get the modules for.
	 * @return {array} All requested modules.
	 */
	function getRequestedModules($element) {
		var dataModuleSelector = '[' + DATA_MODULE + ']',
			requestedModules = [];

		$element
			.find(dataModuleSelector)
			.addBack(dataModuleSelector)
				.each(function() {
					requestedModules = requestedModules.concat(
						parseModuleString($(this).attr(DATA_MODULE))
					);
				});

		return requestedModules;
	}
	/**
	 * Parse the data-module value as an array.
	 *
	 * @param {string} moduleString Comma delimited string.
	 * @return {array} The requested modules.
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
		if (uniqueModules) {
			for (var module in uniqueModules) {
				requireModuleAndFireMethods(module, method);
			}
		}
	}
	/**
	 * Requires a module and fires specified methods.
	 *
	 * @param {object} module The module to call the method on
	 * @param {string} method The method to fire for all modules
	 * @return {void}
	 */
	function requireModuleAndFireMethods(module, method) {
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
		if ($.isFunction(module[method])) {
			module[method]();
		}
	}
	/**
	 * Fires documentComplete method on modules. This event occurs after
	 * font-face has been loaded.
	 *
	 * @return {void}
	 */
	function documentComplete() {
		if (documentCompleteIsReady()) {
			fireModuleMethods('documentComplete');

			documentCompleteHasBeenTrigger = true;
		}
	}
	/**
	 * For document.complete to be ready document.ready needs to have already
	 * fired, documentComplete must have not already been called, and
	 * document.readyState must equal complete.
	 *
	 * @return {void}
	 */
	function documentCompleteIsReady() {
		return (
			documentReadyHasBeenTrigger &&
			!documentCompleteHasBeenTrigger &&
			document.readyState === 'complete'
		);
	}
	/**
	 * Load links load an ajax request replacing a container with the id provided
	 * in the data-load_container attribute.
	 *
	 * @param {object} event Click event
	 * @return {void}
	 */
	function handleLoaderLinkClick(event) {
		var $link = $(this);

		preventDefault(event);
		loadUrl($link.attr('href'), $link.attr(DATA_LOAD_CONTAINER), $link);
	}
	/**
	 * Loads ajax request from a url replacing a container with the id provided and
	 * updates a link with loading, error, and loaded classes.
	 *
	 * @param {string} url The url of the ajax request
	 * @param {string} containerId The container id to load the request into
	 * @param {object} $link The link making the request
	 * @return {void}
	 */
	function loadUrl(url, containerId, $link) {
		var $container = $('#' + containerId);

		var repsonseClasses = LOADED_CLASS + ' ' + ERROR_CLASS;

		updateElementClass($container, LOADING_CLASS, repsonseClasses);
		updateElementClass($link, LOADING_CLASS, repsonseClasses);

		$.ajax({
			url: url
		}).done(function(response) {
			loadRepsonseInContainer($container, response, $link);
		}).fail(function() {
			showLoadError($container, $link);
		});
	}
	/**
	 * Adds and removes a class to a given element.
	 *
	 * @param {object} $element The element to update the classes
	 * @param {string} addClass The class to add
	 * @param {string} removeClass The class to remove
	 * @return {void}
	 */
	function updateElementClass($element, addClass, removeClass) {
		if ($element.length) {
			if (addClass) {
				$element.addClass(addClass);
			}

			if (removeClass) {
				$element.removeClass(removeClass);
			}
		}
	}
	/**
	 * Loads ajax request repsonse replacing a given containerm loads the
	 * modules in the provided repsonse, and updates the repsonse and link with
	 * the loaded class.
	 *
	 * @param {object} $container The container to load the request into
	 * @param {string} response The ajax repsonse
	 * @param {object} $link The link making the request
	 * @return {void}
	 */
	function loadRepsonseInContainer($container, response, $link) {
		if ($container.length) {
			var $response = $(response);

			$container.replaceWith($response);

			updateElementClass($response, LOADED_CLASS);
			loadModulesInElement($response);
			updateElementClass($link, LOADED_CLASS, LOADING_CLASS);
			dispatcher.fireCallbacks(utilMethods, $response);
		}
	}
	/**
	 * Adds an error class to the container and link.
	 *
	 * @param {object} $container The container to load the request into
	 * @param {object} $link The link making the request
	 * @return {void}
	 */
	function showLoadError($container, $link) {
		updateElementClass($container, ERROR_CLASS, LOADING_CLASS);
		updateElementClass($link, ERROR_CLASS, LOADING_CLASS);
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
	 * Loads all modules in a given element. Since this happens after page load,
	 * we should fire both load and documentComplete.
	 *
	 * @param {object} $element The element to get the modules for.
	 * @return {void}
	 */
	function loadModulesInElement($element) {
		uniqueModules = getUniqueModules($element);

		fireModuleMethods('load');
		fireModuleMethods('documentComplete');
	}
	/**
	 * All utils should load themselves.
	 */
	load();

	return {
		/**
		 * Allows utilities to register methods that should be called after ajax
		 * loads. They get passed the jQuery object of the loaded response.
		 *
		 * @param {function} method Function to call on ajax load
		 * @return {void}
		 */
		registerUtilMethod: function(method) {
			utilMethods.push(method);
		},
		/**
		 * Loads all modules in a given element. Since this happens after page load,
		 * we should fire both load and documentComplete.
		 *
		 * @param {object} $element The element to get the modules for
		 * @return {void}
		 */
		loadModules: loadModulesInElement,
		/**
		 * Loads ajax request from a url replacing a container with the id provided and
		 * updates a link with loading, error, and loaded classes.
		 *
		 * @param {string} url The url of the ajax request
		 * @param {string} containerId The container id to load the request into
		 * @param {object} $link The link making the request
		 * @return {void}
		 */
		loadUrl: loadUrl
	};
});