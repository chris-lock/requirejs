/**
 * Adds support to require for async js like Google Maps and YouTube iframe API.
 * Rewritten and cleaned up.
 *
 * @author Miller Medeiros - https://github.com/millermedeiros
 * @author Matthias H. Risse - https://github.com/mhrisse
 * @src https://github.com/mhrisse/requirejs-plugins/blob/master/src/async.js
 *
 * @return {object} Public methods.
 */
define(function() {
		/** @constant Default callback name. */
	var DEFAULT_PARAM_NAME = 'callback';

		/** @type {int} The unique id used for storing the default callback. */
	var requireId = 0;

	/**
	 * Gets the callback parameter from a url or returnsthe default if not found.
	 *
	 * @param {string} url The url to get the callback from.
	 * @return {string} Callback name.
	 */
	function getCallbackName(url) {
		var urlParts = url.replace('https:').replace('http:').split(':'),
			urlCallback = urlParts[1];

		if (urlCallback)
			return urlCallback;
		
		requireId++;

		return '__async_req_'+ requireId +'__';
	}
	/**
	 * Gets a formated url with the src and callback.
	 *
	 * @param {string} url The url to format.
	 * @param {string} callbackName The callback function parameter.
	 * @return {string} Formated url.
	 */
	function getFormatedUrl(url, callbackName) {
		var urlParts = url.split('!'),
			baseUrl = urlParts[0],
			urlParam = urlParts[1] || DEFAULT_PARAM_NAME,
			queryChar = (baseUrl.indexOf('?') < 0) ? '?' : '&';

		return baseUrl + queryChar + urlParam + '=' + callbackName;
	}
	/**
	 * Adds a script tag to the page for the script.
	 *
	 * @param {string} url The url of the script.
	 * @return {void}
	 */
	function injectScript(src) {
		var script = document.createElement('script'),
			tag = document.getElementsByTagName('script')[0];

		script.type = 'text/javascript';
		script.async = true;
		script.src = src;

		tag.parentNode.insertBefore(script, tag);
	}

	return {
		/**
		 * Called by all require plugins. Does nothing if being called as part 
		 * of an optimizer build. Otherwise, adds a script tag for the js and 
		 * stores the onLoad as a global variable so the callback function can 
		 * define a new module after async load.
		 *
		 * @src http://requirejs.org/docs/plugins.html
		 *
		 * @param {string} name Resource to load
		 * @param {obect} req A local "require" function to use to load other modules
		 * @param {function} onload A function to call with the value for name
		 * @param {object} config A configuration object
		 * @return {void}
		 */
		load: function(name, req, onLoad, config) {
			if (config.isBuild) {
				onLoad(null);
			} else {
				var callbackName = getCallbackName(name);
				
				window[callbackName] = onLoad;
				injectScript(getFormatedUrl(name, callbackName));
			}
		}
	};
});