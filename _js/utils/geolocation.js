/**
 * A utility for detecting geolocation support and getting current geolocation.
 * Wrttien to handle US locations and assuming Google Maps API v3.
 *
 * @src https://developers.google.com/maps/documentation/geocoding/#Results
 *
 * @author Chris Lock
 *
 * @param {object} GoogleMaps Google Maps v3.
 * @param {object} Dispatcher Dispatcher utility.
 * @param {object} Cookies Cookies utility.
 * @return {object} Public methods.
 */
 define(['GoogleMaps', 'Dispatcher', 'Cookies'], function(GoogleMaps, Dispatcher, Cookies) {
		/** @constant The cookie name. */
	var COOKIE_NAME = 'MM_LOCATION',
		/** @constant The cookie expiration in hours. */
		COOKIE_EXPIRATION_IN_MINUTES = 24 * 60;

		/** @type {bool} Does the browser support geolocation. */
	var supported = false,
		/** @type {object} Is the location object ready. */
		locationIsReady = false,
		/** @type {object} The location object with the corresponding Google geocoder properties. */
		location = {},
		/** @type {object} Callback queue for onUpdate and onError events. */
		callbacks = {
			onUpdate: [],
			onError: []
		};

	/**
	 * Public load method
	 *
	 * @return {void}
	 */
	function load() {
		if (navigator.geolocation) {
			supported = true;

			updateLocation();
		}
	}
	/**
	 * Updates the location if the user has already been geolcated.
	 *
	 * @return {void}
	 */
	function updateLocation() {
		var locationCookie = Cookies.get(COOKIE_NAME);

		if (locationCookie.isBrowserLocation) {
			getLocation(callbacks.onUpdate);
		}
	}
	/**
	 * Checks to see if geolocation is supported by the browser
	 *
	 * @return {bool} Geolocation is supported
	 */
	function isSupported() {
		return supported;
	}
	/**
	 * Gets the location object.
	 *
	 * @param {array} callbacks An array of callback functions to fire when geolocation is ready.
	 * @return {void}
	 */
	function getLocation(callbacks) {
		if (isSupported()) {
			if (locationIsReady) {
				fireLocationCallback(callbacks);
			} else {
				navigator.geolocation.getCurrentPosition(function(position) {
					handleGeolocationSuccess(position, callbacks);
				}, handleGeolocationFailure);
			}
		}
	}
	/**
	 * A wrapper for the dispatcer to matain consistency.
	 *
	 * @param {function} callbacks An array of callbacks
	 * @return {void}
	 */
	function fireLocationCallback(callbacks) {
		Dispatcher.fireCallbacks(callbacks, location);
	}
	/**
	 * Gets a normalized location object from Google maps and handles success or
	 * failure.
	 *
	 * @param {object} position The object returned by navigator.geolocation.getCurrentPosition.
	 * @param {function} callbacks An array of callbacks
	 * @return {void}
	 */
	function handleGeolocationSuccess(position, callbacks) {
		GoogleMaps.getLocationFromLatLng(
			'geolocation',
			position.coords.latitude + ',' + position.coords.longitude,
			function(googleLocation) {
				handleGoogleGetLocationSuccess(googleLocation, callbacks);
			},
			handleGoogleGetLocationFailure
		);
	}
	/**
	 * Updates the location object based on the Google maps response.
	 *
	 * @param {object} googleLocation The location object from Google maps
	 * @return {void}
	 */
	function handleGoogleGetLocationSuccess(googleLocation, callbacks) {
		googleLocation.isBrowserLocation = true;
		location = googleLocation;

		Cookies.set(COOKIE_NAME, location, COOKIE_EXPIRATION_IN_MINUTES);

		locationIsReady = true;

		fireLocationCallback(callbacks);
	}
	/**
	 * Fires error callbacks with approprite messages
	 *
	 * @param {string} status The status of the response.
	 * @return {void}
	 */
	function handleGoogleGetLocationFailure(status) {
		fireErrorCallbacks('Sorry, we could not determine your location.');
	}
	/**
	 * A wrapper for message.alert to only show if the flag is set.
	 *
	 * @param {string} message Alert message
	 * @return {void}
	 */
	function fireErrorCallbacks(message) {
		Dispatcher.fireCallbacks(callbacks.onError, message);
	}
	/**
	 * Fires error callbacks with approprite messages
	 *
	 * @return {void}
	 */
	function handleGeolocationFailure(error) {
		if (error.PERMISSION_DENIED) {
			fireErrorCallbacks('Please give permission if you would like to be geolocated.');
		} else {
			fireErrorCallbacks('Sorry, we could not determine your location.');
		}
	}
	/**
	 * All modules should load themselves.
	 */
	load();

	return {
		/**
		 * Checks to see if geolocation is supported by the browser
		 *
		 * @return {bool} Geolocation is supported
		 */
		isSupported: isSupported,
		/**
		 * Gets the current geolocation.
		 *
		 * @param {function} callback A callback function to fire when geolocation is ready since it's asynchronous.
		 * @return {object} The location object
		 */
		get: function(callback) {
			getLocation([callback]);
		},
		/**
		 * Adds a function to be fired when location is update, which occurs
		 * when get is called or on page load after the initial request.
		 *
		 * @param {function} callback A callback function to fire when geolocation is updated.
		 * @return {object} The location object
		 */
		onUpdate: function(callback) {
			callbacks.onUpdate.push(callback);
		},
		/**
		 * Adds a function to be fired when geolocations encounters an error.
		 *
		 * @param {function} callback A callback function to fire when geolocation encounters an error.
		 * @return {string} Error message
		 */
		onError: function(callback) {
			callbacks.onError.push(callback);
		},
		/**
		 * Unsets the geolocation cookie.
		 *
		 * @return {void}
		 */
		unSet: function() {
			Cookies.unSet(COOKIE_NAME);
		}
	};
});