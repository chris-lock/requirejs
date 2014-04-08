/**
 * This is primarily used for detecting Android since it hates people. It could
 * be used to detect other OS.
 *
 * @author Chris Lock
 *
 * @return {object} Public methods.
 */
 define([], function() {
		/** @constant The version of Android supported. Set to be absurdly high till Android wants to play nice with touch events. */
	var	ANDROID_VERSION_SUPPORTED = 999;

		/** @type {object} The user agent object. */
	var userAgent = navigator.userAgent;

	/**
	 * Public load method
	 *
	 * @return {void}
	 */
	function load() {}
	/**
	 * All modules should load themselves.
	 */
	load();

	return {
		/**
		 * Checks to see if it's an android device since they are worthless.
		 *
		 * @return {bool} Is compatible OS
		 */
		isCompatible: function() {
			if (userAgent.indexOf("Android") > -1) {
				var androidVersion = parseFloat(userAgent.slice(userAgent.indexOf("Android") + 8)); 
				
				if (androidVersion < ANDROID_VERSION_SUPPORTED) {
					return false;
				}
			}
			
			return true;
		},
		/**
		 * Returns if the os supports touch
		 *
		 * @return {bool} Is touch device.
		 */
		supportsTouch: function() {
			return ('ontouchstart' in document.documentElement);
		}
	};
});