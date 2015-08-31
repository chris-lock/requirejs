'use strict';

/**
 * A utility to log across all devices. We can just use console log unless it's
 * a touch device or IE8.
 *
 * @author Chris Lock
 *
 * @param {object} Browser Browser utility.
 * @param {object} jquery jQuery library.
 * @return {object} Public methods.
 */
define(['Browser', 'jquery'], function(Browser, $) {
		/** @constant The class used for the html logger. */
	var	HTML_LOGGER_CLASS = '_html-logger',
		/** @constant The css used for the html logger. */
		HTML_LOGGER_CSS = {
			'border-top': '1px solid #fff',
			'list-style': 'inside decimal-leading-zero',
			'max-height': '100px',
			'overflow': 'auto',
			'padding': '5px'
		},
		/** @constant The class used for the html logger wrapper. */
		HTML_LOGGER_WRAPPER_CLASS = HTML_LOGGER_CLASS + '-wrapper',
		/** @constant The css used for the html logger wrapper. */
		HTML_LOGGER_WRAPPER_CSS = {
			'-webkit-backface-visibility': 'hidden',
			'backface-visibility': 'hidden',
			'background': '#000',
			'bottom': '0',
			'color': '#fff',
			'font': '12px monospace',
			'left': '0',
			'position': 'fixed',
			'right': '0'
		},
		/** @constant The class used for the html logger toggle. */
		HTML_LOGGER_TOGGLE_CLASS = HTML_LOGGER_CLASS + '-toggle',
		/** @constant The css used for the html logger toggle. */
		HTML_LOGGER_TOGGLE_CSS = {
			'padding': '2px 5px'
		};

		/** @type {bool} Does the agent support console. */
	var supportsConsole = false,
		/** @type {bool} Should we use console. */
		shouldUseConsole = false,
		/** @type {bool} Is the html logger built. */
		loggerIsBuilt = false;

		/** @type {object} The wrapper for the html logger. */
	var $htmlLoggerWrapper = $(),
		/** @type {object} The html logger. */
		$htmlLogger = $();

	/**
	 * We need to make sure console exists and that we should use it.
	 *
	 * @return {void}
	 */
	function load() {
		supportsConsole = (console && !Browser.supportsTouch() && !Browser.isIE8());
		shouldUseConsole = supportsConsole;
	}
	/**
	 * Logs items in the html logger.
	 *
	 * @params {mixed} logItems The items to log
	 * @return {void}
	 */
	function htmlLog(logItems) {
		buildLogger();

		$.each(logItems, function() {
			htmlLogItem(this);
		});
	}
	/**
	 * Logs an individual item in the html logger.
	 *
	 * @params {mixed} logItem The item to log
	 * @return {void}
	 */
	function htmlLogItem(logItem) {
		addChildToParent($htmlLogger, 'li', logItem);
		$htmlLogger.scrollTop($htmlLogger.prop('scrollHeight'));
	}
	/**
	 * Buidls the logger if it's not already built.
	 *
	 * @return {void}
	 */
	function buildLogger() {
		if (loggerIsBuilt) {
			return;
		}

		$htmlLoggerWrapper = addChildToParent(
				$('html'),
				'div',
				'',
				HTML_LOGGER_WRAPPER_CLASS,
				HTML_LOGGER_WRAPPER_CSS
			);

		addChildToParent(
			$htmlLoggerWrapper,
			'p',
			'Console',
			HTML_LOGGER_TOGGLE_CLASS,
			HTML_LOGGER_TOGGLE_CSS
		).click(toggleLoggerVisibility);

		$htmlLogger = addChildToParent(
				$htmlLoggerWrapper,
				'ol',
				'',
				HTML_LOGGER_CLASS,
				HTML_LOGGER_CSS
			);

		loggerIsBuilt = true;
	}
	/**
	 * Adds a child with the given class and css to a parent element and returns
	 * the child object.
	 *
	 * @param {object} $parent The parent element
	 * @param {string} childType The type of element to make the child
	 * @param {string} childContent The content for the child
	 * @param {string} childClass The class for the child
	 * @param {object} childCss The css for the child
	 * @return {object} The child element object
	 */
	function addChildToParent($parent, childType, childContent, childClass, childCss) {
		$parent.append(getChildHtml(childType, childContent, childClass));

		return getChildWithCss($('.' + childClass), childCss);
	}
	/**
	 * Gets the child element as an html string.
	 *
	 * @param {string} childType The type of element to make the child
	 * @param {string} childContent The content for the child
	 * @param {string} childClass The class for the child
	 * @return {string} The child element as an html string
	 */
	function getChildHtml(childType, childContent, childClass) {
		var childClassTag = (childClass)
				? ' class="' + childClass + '"'
				: '',
			childContentHtml = childContent || '';

		return '' +
			'<' + childType + childClassTag + '>' +
				childContentHtml +
			'</' + childType + '>';
	}
	/**
	 * Gets the child element after adding the css.
	 *
	 * @param {object} $child The child element
	 * @param {object} childCss The css for the child
	 * @return {object} The child element object
	 */
	function getChildWithCss($child, childCss) {
		return (childCss) ? $child.css(childCss) : $child;
	}
	/**
	 * Toggles the visibility of the logger.
	 *
	 * @return {void}
	 */
	function toggleLoggerVisibility() {
		$htmlLogger.toggle();
	}
	/**
	 * All utils should load themselves.
	 */
	load();


	return {
		/**
		 * Forces the logger to use or not use the logger.
		 *
		 * @return {object} Returns the logger for chaining.
		 */
		useConsole: function(shouldUseConsoleValue) {
			shouldUseConsole = shouldUseConsoleValue;

			return this;
		},
		/**
		 * Logs an item to the html logger of console.
		 *
		 * @params {mixed} logItem The items to log
		 * @return {void}
		 */
		log: function() {
			var logItems = arguments;

			if (shouldUseConsole || (supportsConsole && shouldUseConsole)) {
				console.log.apply(console, arguments);
			} else {
				htmlLog(logItems);
			}
		}
	};
});