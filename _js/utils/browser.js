'use strict';

/**
 * This is primarily used for detecting Android since it hates people. It could
 * be used to detect other OS.
 *
 * @author Chris Lock
 *
 * @param {object} jquery jQuery library.
 * @return {object} Public methods.
 */
 define(['jquery'], function($) {
		/** @constant The version of Android supported. Set to be absurdly high till Android wants to play nice with touch events. */
	var	ANDROID_VERSION_SUPPORTED = 999,
		/** @constant CSS attributes that need to be checked for support. */
		CSS_SUPPORT = {
			TRANSFORMS: {
				'transform':'transform',
				'webkitTransform':'-webkit-transform',
				'OTransform':'-o-transform',
				'msTransform':'-ms-transform',
				'MozTransform':'-moz-transform'
			}
		};

		/** @type {object} The user agent object. */
	var userAgent = navigator.userAgent;

	/**
	 * Public load method
	 *
	 * @return {void}
	 */
	function load() {
		var osClass = (isCompatible())
				? 'no-android'
				: 'android';

		$('html').addClass(osClass);
	}
	/**
	 * Checks to see if it's an android device since they are worthless.
	 *
	 * @return {bool} Is compatible OS
	 */
	function isCompatible() {
		var androidVersion = getUserAgentVersion('Android');

		if (androidVersion > -1 && androidVersion <= ANDROID_VERSION_SUPPORTED) {
			return false;
		}

		return true;
	}
	/**
	 * Gets the version of a given user agent. If the user agent doesn't match
	 * the string, it returns -1;
	 *
	 * @param {string} agentName The string to use as the user agent
	 * @return {float} The version of the given user agent
	 */
	function getUserAgentVersion(agentName) {
		var agentNameLengthWithSpace = agentName.length + 1,
			agentVersionIndex = getUserAgentIndex(agentName) + agentNameLengthWithSpace;

		return userAgentIs(agentName)
			? parseFloat(userAgent.slice(agentVersionIndex))
			: -1;
	}
	/**
	 * Gets the index of the string in the user agent.
	 *
	 * @param {string} agentName The string to check the user agent for
	 * @return {int} The index of the string in the user agent
	 */
	function getUserAgentIndex(agentName) {
		return userAgent.toLowerCase().indexOf(agentName.toLowerCase());
	}
	/**
	 * Checks to see if the user agent matches a string.
	 *
	 * @param {string} agentName The string to check the user agent for
	 * @return {bool} Is given user agent
	 */
	function userAgentIs(agentName) {
		return (getUserAgentIndex(agentName) > -1);
	}
	function getSupportedTranslate3dAttrs() {
		return getSupportedCssAttr(getValidTranslate3dAttrs);
	}
	function getSupportedCssAttr(getCssAttrMethod) {
		var elem = document.createElement('div'),
			supportedCssAttrs = [];

		document.body.insertBefore(elem, null);

		supportedCssAttrs = getCssAttrMethod(elem);

		document.body.removeChild(elem);

		return supportedCssAttrs;
	}
	function getValidTranslate3dAttrs(elem) {
		return getCssAttrsMatchingValue(
			elem,
			CSS_SUPPORT.TRANSFORMS,
			'translate3d(1px, 1px, 1px)'
		);
	}
	function getCssAttrsMatchingValue(elem, cssAttr, cssAttrValue) {
		var invalidValue = (cssAttrValue !== 'none') ? 'none' : '';

		return $.map(cssAttr, function(propertyAttr, styleAttr) {
			return getMatchingCssAttrValues(
				elem,
				styleAttr,
				propertyAttr,
				cssAttrValue,
				invalidValue
			);
		});
	}
	function getMatchingCssAttrValues(elem, styleAttr, propertyAttr, cssAttrValue, invalidValue) {
		var propertyValue = '';

		if (elem.style[styleAttr] !== undefined) {
			elem.style[styleAttr] = cssAttrValue;
			propertyValue = window.getComputedStyle(elem)
				.getPropertyValue(propertyAttr);

			if (propertyValue !== undefined && propertyValue !== invalidValue) {
				return styleAttr;
			}
		}
	}
	function isAndroid() {
		return userAgentIs('Android');
	}
	function isiPad() {
		return userAgentIs('iPad');
	}
	function isiPhone() {
		return userAgentIs('iPhone');
	}
	function isFirefox() {
		return userAgentIs('firefox');
	}
	function isSafari() {
		return userAgentIs('isSafari');
	}
	/**
	 * All utils should load themselves.
	 */
	load();

	return {
		/**
		 * Checks to see if it's IE8. WE can use addEventListener since it
		 * doesn't support it.
		 *
		 * @return {bool} Is IE8
		 */
		isIE8: function() {
			return (userAgentIs('MSIE') && !document.addEventListener);
		},
		isAndroid: isAndroid,
		isiPad: isiPad,
		isiPhone: isiPhone,
		isMobile: function() {
			return (isAndroid() || isiPad() || isiPhone());
		},
		isFirefox: isFirefox,
		isSafari: isSafari,
		/**
		 * Checks to see if it's an android device since they are worthless.
		 *
		 * @return {bool} Is compatible OS
		 */
		isCompatible: isCompatible,
		/**
		 * Returns if the os supports touch
		 *
		 * @return {bool} Is touch device.
		 */
		supportsTouch: function() {
			return ('ontouchstart' in document.documentElement);
		},
		getSupportedTranslate3dAttrs: getSupportedTranslate3dAttrs,
		supportsTranslate3d: function() {
			return (getSupportedTranslate3dAttrs().length > 0);
		}
	};
});