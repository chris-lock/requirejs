/**
 * Sets, gets, and checks for cookies.
 *
 * @author Chris Lock
 *
 * @return {object} Public methods.
 */
 define([], function() {
	/**
	 * Public load method
	 *
	 * @return {void}
	 */
	function load() {}
	/**
	 * Sets a cookie.
	 *
	 * @param {string} name The cookie name.
	 * @param {string} value The cookie value.
	 * @param {string} experationInHours The cookie experiation date in minutes.
	 * @return {void}
	 */
	function setCookie(name, value, experationInMinutes) {
		var tenYearsInMinutes = 10 * 365 * 24 * 60,
			cookieExpirationInMinutes = experationInMinutes || tenYearsInMinutes,
			cookieExpiration = cookieExpirationInMinutes * 60 * 1000,
			cookieDate = new Date();

		cookieDate.setTime(cookieDate.getTime() + cookieExpiration);

		var cookieExpirationParam = 'expires=' + cookieDate.toGMTString();

		document.cookie = name + "=" + JSON.stringify(value) + "; " + cookieExpirationParam;
	}
	/**
	 * Gets the value of a cookie
	 *
	 * @return {string|array|object} The cookie value.
	 */
	function getCookie(name) {
		var nameParam = name + '=',
			cookiesArray = document.cookie.split(';');

		for (var i = cookiesArray.length - 1; i >= 0; i--) {
			var currentCookie = cookiesArray[i];

			while (currentCookie.charAt(0) == ' ')
				currentCookie = currentCookie.substring(1, currentCookie.length);

			if (currentCookie.indexOf(nameParam) === 0)
				return parseCookieValue(
					currentCookie.substring(nameParam.length, currentCookie.length)
				);
		}
		
		return '';
	}
	/**
	 * Attempts to JSON parse the cookie value. If it wasn't stored with JSON
	 * stringify, it returns the cooke value.
	 *
	 * @param {string} cookieValue The cookie value
	 * @return {string|array|object} The cookie value as it was stored
	 */
	function parseCookieValue(cookeValue) {
		try {
			return JSON.parse(cookeValue);
		} catch(error) {
			return cookeValue;
		}
	}
	/**
	 * All modules should load themselves.
	 */
	load();

	return {
		/**
		 * Sets a cookie.
		 *
		 * @param {string} name The cookie name.
		 * @param {string|array|object} value The cookie value.
		 * @param {string} experationInHours The cookie experiation date in minutes.
		 * @return {void}
		 */
		set: function(name, value, experationInMinutes) {
			setCookie(name, value, experationInMinutes);
		},
		/**
		 * Checks if a cookie is set.
		 *
		 * @param {string} name The cookie name.
		 * @return {bool} The cookie is set.
		 */
		isSet: function(name) {
			return (Boolean(getCookie(name)));
		},
		/**
		 * Gets the value of a cookie
		 *
		 * @return {string} The cookie value.
		 */
		get: function(name) {
			return getCookie(name);
		},
		/**
		 * Deletes a cookie with the given name.
		 *
		 * @return {void}
		 */
		unSet: function(name) {
			setCookie(name, '', -1);
		}
	};
});