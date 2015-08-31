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
define(['jquery', 'Dispatcher'], function($, Dispatcher) {
		/** @type {constant} The data attribute for modules. */
	var DATA_MODULE = 'data-module',
		/** @type {constant} The selector for elements with the module data attribute. */
		DATA_MODULE_SELECTOR = '[' + DATA_MODULE + ']',
		/** @type {constant} The class for elements that have already been loaded. */
		MODULE_LOADED_CLASS = '_module-loaded',
		/** @type {constant} The selector for elements that have already been loaded. */
		MODULE_LOADED_SELECTOR = '.' + MODULE_LOADED_CLASS,
		/** @type {constant} The selector for load links. */
		LOADER_LINK_SELECTOR = '.loader-link',
		/** @type {constant} The data attribute of the container class to load ajax into. */
		DATA_LOAD_CONTAINER = 'data-load_container',
		/** @type {constant} The data attribute of the class of elements to remove on load. */
		DATA_LOAD_REMOVE_CLASS = 'data-load_remove_class',
		/** @type {constant} The class added when ajax is loading. */
		LOADING_CLASS = '_loading',
		/** @type {constant} The class added when ajax is loaded. */
		LOADED_CLASS = '_loaded',
		/** @type {constant} The class added when ajax has an error. */
		ERROR_CLASS = '_error';

		/** @type {object} The document. */
	var $document = $(document);

		/** @type {bool} $(document).ready has fired. */
	var documentReadyHasBeenTrigger = false,
		/** @type {bool} document.onreadystatechange has fired. */
		documentCompleteHasBeenTrigger = false,
		/** @type {object} The modules initially requested on the page. */
		initialModules = {},
		/** @type {object} The util methods that should be called on ajax load. */
		utilMethods = [];

	/**
	 * Fire modules' public load method when document is ready and fires
	 * modules' public documentComplete method when document is complete. This
	 * event occurs after font-face has been loaded. Binds ajax links and
	 * post-load event.
	 *
	 * @return {void}
	 */
	function load() {
		$document.ready(documentReady);
		document.onreadystatechange = documentComplete;

		$('body').on('click', LOADER_LINK_SELECTOR, handleLoaderLinkClick);
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
		initialModules = getRequestedModules($document);

		fireModuleMethods(initialModules, 'load');
		documentComplete();
	}
	/**
	 * Gets all requested modules requested in an element.]
	 *
	 * @param {object} $element The element to get the modules inside.
	 * @return {array} All requested modules.
	 */
	function getRequestedModules($element) {
		var	requestedModules = {};

		getModuleElements($element).each(function() {
			requestedModules = getElementModules($(this), requestedModules);
		});

		return requestedModules;
	}
	/**
	 * Gets all elements with a module attribute. Addback includes the parent in
	 * case it has a data-module attribute as well.
	 *
	 * @param {object} $element The element to get the modules for.
	 * @return {object} All elements with module attributes.
	 */
	function getModuleElements($element) {
		return $element
			.find(DATA_MODULE_SELECTOR)
			.addBack(DATA_MODULE_SELECTOR)
			.not(MODULE_LOADED_SELECTOR);
	}
	/**
	 * Gets all modules requested by a given element.
	 *
	 * @param {object} $element The element to get the modules for.
	 * @param {object} requestedModules The current set of requested modules
	 * @return {object} Requested modules with the elements modules added.
	 */
	function getElementModules($element, requestedModules) {
		$element.addClass(MODULE_LOADED_CLASS);

		$.map(parseModuleString($element.attr(DATA_MODULE)), function(moduleName) {
			requestedModules[moduleName] = requestedModules[moduleName] || [];
			requestedModules[moduleName].push($element);
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
	 * Fires a method on a given set of modules.
	 *
	 * @param {object} modules The modules to fire.
	 * @param {string} method The method to fire for all modules
	 * @return {void}
	 */
	function fireModuleMethods(modules, method) {
		$.each(modules, function(module, elements) {
			requireModuleAndFireMethods(module, method, elements);
		});
	}
	/**
	 * Requires a module and fires specified methods.
	 *
	 * @param {object} module The module to call the method on
	 * @param {string} method The method to fire for all modules
	 * @param {array} elements The elements that need the module
	 * @return {void}
	 */
	function requireModuleAndFireMethods(module, method, elements) {
		require([module], function(module) {
			fireModuleMethod(module, method, elements);
		});
	}
	/**
	 * Ensures the method is available before firing.
	 *
	 * @param {object} module The module to call the method on
	 * @param {string} method The method to fire for all modules
	 * @param {array} elements The elements that need the module
	 * @return {void}
	 */
	function fireModuleMethod(module, method, elements) {
		if (module[method] && $.isFunction(module[method])) {
			$.map(elements, function($element) {
				module[method]($element);
			});
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
			fireModuleMethods(initialModules, 'documentComplete');

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
		loadUrl(
			$link.attr('href'),
			$link.attr(DATA_LOAD_CONTAINER),
			$link,
			$link.attr(DATA_LOAD_REMOVE_CLASS)
		);
	}
	/**
	 * Loads ajax request from a url replacing a container with the class
	 * provided and updates a link with loading, error, and loaded classes.
	 *
	 * @param {string} url The url of the ajax request
	 * @param {string} containerClass The container class to load the request into
	 * @param {object} $link The link making the request
	 * @param {string} removeElementsClass The elements to remove on load
	 * @return {void}
	 */
	function loadUrl(url, containerClass, $link, removeElementsClass) {
		var $container = $('.' + containerClass);

		var repsonseClasses = LOADED_CLASS + ' ' + ERROR_CLASS;

		updateElementClass($container, LOADING_CLASS, repsonseClasses);
		updateElementClass($link, LOADING_CLASS, repsonseClasses);

		$.ajax({
			url: url
		}).done(function(response) {
			loadRepsonseInContainer(
				$container,
				$(response),
				$link,
				$('.' + removeElementsClass)
			);
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
	 * @param {object} $response The ajax repsonse as a jQuery object
	 * @param {object} $link The link making the request
	 * @return {void}
	 */
	function loadRepsonseInContainer($container, $response, $link, $removeElements) {
		if ($container.length) {
			$container.replaceWith($response);
			$removeElements.remove();

			updateElementClass($response, LOADED_CLASS);
			loadModulesInElement($response);
			updateElementClass($link, LOADED_CLASS, LOADING_CLASS);
			Dispatcher.fireCallbacks(utilMethods, $response);
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
		var requestedModules = getRequestedModules($element);

		fireModuleMethods(requestedModules, 'load');
		fireModuleMethods(requestedModules, 'documentComplete');
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