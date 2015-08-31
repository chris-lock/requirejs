/**
 * This module handles the creation of Google Maps, the pins added to them, and
 * geocoding.
 *
 * @author Chris Lock
 *
 * @param {object} GoogleMapsApi The Google Maps API.
 * @param {object} Dispatcher Dispatcher utility.
 * @return {object} Public methods.
 */
define(['GoogleMapsApi', 'Dispatcher'], function(GoogleMapsApi, Dispatcher) {
		/** @constant The maximum zoom for the map. */
	var MARKER_CLASS_CLICKED = ' _clicked',
		/** @constant The class for active markers. */
		MARKER_CLASS_ACTIVE = ' _active',
		/** @constant The class for hoverd markers. */
		MARKER_CLASS_HOVER = ' _hover',
		/** @constant The length of time to wait bewteen geolocate requests. */
		GEOLOCATE_QUEUE_TIMEOUT_DURATION = 500;

		/** @type {array} A queue of geolocation request called on a timeout to prevent sending too many request to Google. */
	var geolocateQueue = [],
		/** @type {bool} Are we waiting so we don't max out the Google reuest limit. */
		geolocateQueueIsWaiting = false,
		/** @type {int} The id for the setTimeout used in the geolocate queue. */
		geolocateQueueTimeoutId = null,
		/** @type {object} An object used to create an empty Google Maps pin so we can add out custom one. */
		markIconEmpty = {
			path: 'M 1,1 z',
			fillColor: 'white',
			fillOpacity: 0.0,
			scale: 1
		};

	/**
	 * Adds a map to a element with the given id.
	 *
	 * @param {string} id The element id
	 * @param {object} center A Google map LatLng object
	 * @param {object} settings A settings object for Google Maps without the center set
	 * @return {object} Google Maps object
	 */
	function buildMap(id, center, settings) {
		var mapSettings = settings || {
				mapTypeControl: false,
				overviewMapControl: false,
				panControl: false,
				scaleControl: false,
				streetViewControl: false,
				maxZoom: 18,
				zoom: 8,
				zoomControl: true,
				zoomControlOptions: {
					position: GoogleMapsApi.ControlPosition.RIGHT_TOP,
					style: GoogleMapsApi.ZoomControlStyle.SMALL
				}
			};

		mapSettings.center = center || new GoogleMapsApi.LatLng(37.09024, -95.712891);

		var map = new GoogleMapsApi.Map(document.getElementById(id), mapSettings);

		/**
		 * Forces the map to redraw in case it wasn't visible when created.
		 *
		 * @return {object} The Google Map object for method chaining
		 */
		map.forceRedraw = function() {
			GoogleMapsApi.event.trigger(this, 'resize');

			return this;
		}
		/**
		 * Adds a marker to the array of markers on the map and it's LatLng for
		 * the map bounds.
		 *
		 * @param {object} marker A MarkerWithLabel object
		 * @param {object} markerLocation A Google Maps LatLng object
		 * @return {object} The Google Map object for method chaining
		 */
		map.addMarker = function(marker, markerLocation) {
			this.markers = this.markers || [];
			this.markers.push(marker);

			this.bounds = this.bounds || new GoogleMapsApi.LatLngBounds();
			this.bounds.extend(markerLocation);

			return this;
		}
		/**
		 * Clears all markers on the map and removes all the LatLng from the
		 * bounds.
		 *
		 * @return {object} The Google Map object for method chaining
		 */
		map.clearMap = function() {
			if (this.markers) {
				for (var i = this.markers.length - 1; i >= 0; i--) {
					this.markers[i].setMap(null);
				}

				delete this.bounds;
				delete this.markers;
			}

			return this;
		}
		/**
		 * Zooms to include all the markers on the map.
		 *
		 * @return {object} The Google Map object for method chaining
		 */
		map.zoomAll = function() {
			if (this.bounds) {
				this.fitBounds(this.bounds);
			}

			return this;
		}
		/**
		 * Sets a marker to active and pans the map.
		 *
		 * @param {object} marker A MarkerWithLabel object
		 * @return {object} The Google Map object for method chaining
		 */
		map.setActiveMarker = function(marker) {
			marker.setActive();
			this.panTo(marker.position);

			return this;
		}
		/**
		 * Clears the active marker.
		 *
		 * @return {object} The Google Map object for method chaining
		 */
		map.clearActiveMarker = function() {
			if (this.markers) {
				for (var i = this.markers.length - 1; i >= 0; i--) {
					this.markers[i].clearActive();
				}
			}

			return this;
		}
		/**
		 * Resets the center of the map to maintain center during resizing.
		 *
		 * @return {object} The Google Map object for method chaining
		 */
		map.resetCenter = function() {
			var center = this.getCenter();

			google.maps.event.trigger(this, 'resize');
			this.setCenter(center);

			return this;
		}

		return map;
	}
	/**
	 * Gets a Google Maps LatLng object for a coma delimited set of lat and lng.
	 *
	 * @param {string} latLng A coma delimited set of lat and lng
	 * @return {object} A Google Maps LatLng object
	 */
	function getLatLngObj(latLng) {
		var	latLngArray = latLng.split(' ').join('').split(',');

		return new GoogleMapsApi.LatLng(latLngArray[0], latLngArray[1]);
	}
	/**
	 * Adds a geolocate request to a queue that is fired on a timeout to avoid
	 * the Google Maps API query limit. Subsequent request from the same module
	 * override previous requests.
	 *
	 * @param {string} module Name of module requesting geolocation
	 * @param {string} paramName The name of the parameter for geolocation either latLng or address
	 * @param {string} paramValue The value for that parameter
	 * @param {function} geolocateCallback The internal method to call after the geolocation
	 * @param {function} successCallback The callback for geolocation success
	 * @param {function} failureCallback The callback for geolocation failure
	 * @param {object} map A Google Map object
	 * @param {object} settings The settings object in adding a marker
	 * @param {function} onclickFunction The function to fire on marker click
	 * @return {void}
	 */
	function addToGeolocateQueue(module, paramName, paramValue, geolocateCallback, successCallback, failureCallback, map, settings, onclickFunction) {
		var moduleGeolocateRequestIndex = getModuleGeolocateRequestIndex(module),
			geolocateRequest = {
				'module': module,
				'paramName': paramName,
				'paramValue': paramValue,
				'geolocateCallback': geolocateCallback,
				'successCallback': successCallback,
				'failureCallback': failureCallback,
				'map': map,
				'settings': settings,
				'onclickFunction': onclickFunction
			};

		if (moduleGeolocateRequestIndex > -1) {
			geolocateQueue.splice(moduleGeolocateRequestIndex, 1, geolocateRequest);
		} else {
			geolocateQueue.push(geolocateRequest);
		}

		if (!geolocateQueueIsWaiting) {
			fireGeolocateRequest();
		}
	}
	/**
	 * Gets the index of the previous geolocate request for that module.
	 * Returns -1 if not found.
	 *
	 * @param {string} module A coma delimited set of lat and lng
	 * @return {int} The index of the previous request from that module
	 */
	function getModuleGeolocateRequestIndex(module) {
		for (var i = geolocateQueue.length - 1; i > -1; i--) {
			if (geolocateQueue[i].module == module) {
				return i;
			}
		}

		return -1;
	}
	/**
	 * Fires the first geolocate request in the queue and remvoes it then sets
	 * a timeout to check for more requests.
	 *
	 * @return {void}
	 */
	function fireGeolocateRequest() {
		geolocateQueueIsWaiting = true;
		geolocateRequest = geolocateQueue.shift();

		geolocate(
			geolocateRequest.paramName,
			geolocateRequest.paramValue,
			geolocateRequest.geolocateCallback,
			geolocateRequest.successCallback,
			geolocateRequest.failureCallback,
			geolocateRequest.map,
			geolocateRequest.settings,
			geolocateRequest.onclickFunction
		);

		geolocateQueueTimeoutId = setTimeout(
			checkGeolocateQueue,
			GEOLOCATE_QUEUE_TIMEOUT_DURATION
		);
	}
	/**
	 * Fires another geolocate request if one is in the queue.
	 *
	 * @return {void}
	 */
	function checkGeolocateQueue() {
		geolocateQueueIsWaiting = false;

		if (geolocateQueue.length) {
			fireGeolocateRequest();
		}
	}
	/**
	 * Geolocates either by latLng or address and fires the appropriate callback.
	 *
	 * @param {string} module Name of module requesting geolocation
	 * @param {string} paramName The name of the parameter for geolocation either latLng or address
	 * @param {string} paramValue The value for that parameter
	 * @param {function} geolocateCallback The internal method to call after the geolocation
	 * @param {function} successCallback The callback for geolocation success
	 * @param {function} failureCallback The callback for geolocation failure
	 * @param {object} map A Google Map object
	 * @param {object} settings The settings object in adding a marker
	 * @param {function} onclickFunction The function to fire on marker click
	 * @return {void}
	 */
	function geolocate(paramName, paramValue, geolocateCallback, successCallback, failureCallback, map, settings, onclickFunction) {
		var googleGeocoder = new GoogleMapsApi.Geocoder(),
			paramObj = {};

		paramObj[paramName] = paramValue;

		googleGeocoder.geocode(paramObj, function(results, status) {
			handleGeocoderResponse(
				results,
				status,
				geolocateCallback,
				successCallback,
				failureCallback,
				map,
				settings,
				onclickFunction
			);
		});
	}
	/**
	 * Handles the geolocate repsonse and fires either success or failure
	 * callback.
	 *
	 * @param {array} results The results array
	 * @param {string} status The status of the geocoder response
	 * @param {function} geolocateCallback The internal method to call after the geolocation
	 * @param {function} successCallback The callback for geolocation success
	 * @param {function} failureCallback The callback for geolocation failure
	 * @param {object} map A Google Map object
	 * @param {object} settings The settings object in adding a marker
	 * @param {function} onclickFunction The function to fire on marker click
	 * @return {void}
	 */
	function handleGeocoderResponse(results, status, geolocateCallback, successCallback, failureCallback, map, settings, onclickFunction) {
		if (status == GoogleMapsApi.GeocoderStatus.OK && results.length) {
			geolocateCallback(results[0], successCallback, map, settings, onclickFunction);
		} else {
			Dispatcher.fireCallbacks([failureCallback], status);
		}
	}
	/**
	 * Fires the provided callbacks and passes it a normalized google maps
	 * location object.
	 *
	 * @param {object} results The first results from Google Maps
	 * @param {function} successCallback The success callback
	 * @return {void}
	 */
	function geolocateCallbackLocation(result, successCallback) {
		Dispatcher.fireCallbacks([successCallback], getLocation(result));
	}
	/**
	 * Returns an updated location object based on the Google Maps response.
	 *
	 * @param {object} results The first results from Google Maps
	 * @return {void}
	 */
	function getLocation(result) {
		return setLocationProps(setLocationGoogleProps(getGoogleLocation(), result));
	}
	/**
	 * Returns a normalized location object.
	 *
	 * @return {object} A normalized location object
	 */
	function getGoogleLocation() {
		return {
			streetNumber: 'street_number.long_name',
			street: 'route.long_name',
			city: 'sublocality.long_name',
			state: 'administrative_area_level_1.long_name',
			stateAbbr: 'administrative_area_level_1.short_name',
			country: 'country.long_name',
			postalCode: 'postal_code.long_name',
			google: {}
		};
	}
	/**
	 * Adds properties to a google object inside the location object to preserve
	 * all properties.
	 *
	 * @param {object} googleLocation A normalized location object
	 * @param {object} results The first results from Google Maps
	 * @return {object} A normalized location object with the google properties
	 */
	function setLocationGoogleProps(googleLocation, results) {
		var addressComponents = results.address_components;

		for (var i = addressComponents.length - 1; i >= 0; i--) {
			var addressComponent= addressComponents[i],
				googleProp = addressComponent.types[0];

			googleLocation.google[googleProp] = {};
			googleLocation.google[googleProp].long_name = addressComponent.long_name;
			googleLocation.google[googleProp].short_name = addressComponent.short_name;
		}

		return googleLocation;
	}
	/**
	 * Updates the default location properties with their corresponding values
	 * from the geocoder response, assuming they are present.
	 *
	 * @param {object} googleLocation A normalized location object with the google properties
	 * @return {object} A normalized location object with the location and google properties
	 */
	function setLocationProps(googleLocation) {
		for (var prop in googleLocation) {
			var locationProp = googleLocation[prop];

			if (typeof locationProp === 'string') {
				var locationPropMap = locationProp.split('.'),
					locationGoogleProp = locationPropMap[0],
					locationGooglePropLength = locationPropMap[1];

				if (googleLocation.google[locationGoogleProp] && googleLocation.google[locationGoogleProp][locationGooglePropLength]) {
					googleLocation[prop] = googleLocation.google[locationGoogleProp][locationGooglePropLength];
				}
			}
		}

		return googleLocation;
	}
	/**
	 * Geolocates a given address and fires the corresponding callbacks.
	 *
	 * @param {string} module Name of module requesting geolocation
	 * @param {string} address The address to geolocate
	 * @param {function} geolocateCallback The internal method to call after the geolocation
	 * @param {function} successCallback The callback for geolocation success
	 * @param {function} failureCallback The callback for geolocation failure
	 * @param {object} map A Google Map object
	 * @param {object} settings The settings object in adding a marker
	 * @param {function} onclickFunction The function to fire on marker click
	 * @return {void}
	 */
	function geolocateByAddress(module, address, geolocateCallback, successCallback, failureCallback, map, settings, onclickFunction) {
		addToGeolocateQueue(
			module,
			'address',
			address,
			geolocateCallback,
			successCallback,
			failureCallback,
			map,
			settings,
			onclickFunction
		);
	}
	/**
	 * Adds a marker with the given settings to a given map then adds the given
	 * onclick funciton and fires the given success callback.
	 *
	 * @param {object} markerLocation A Google Maps LatLng object
	 * @param {function} successCallback The callback for geolocation success
	 * @param {object} map A Google Map object
	 * @param {object} settings The settings object in adding a marker
	 * @param {function} onclickFunction The function to fire on marker click
	 * @return {void}
	 */
	function addMarkerToMap(markerLocation, successCallback, map, settings, onclickFunction) {
		var markerSettings = settings || {};

		markerSettings.position = markerLocation;
		markerSettings.map = map;
		markerSettings.icon = markIconEmpty;
		markerSettings.labelAnchor = new GoogleMapsApi.Point(13, 40);
		markerSettings.labelInBackground = false;

		var marker = new GoogleMapsApi.MarkerWithLabel(markerSettings);

		/**
		 * Makes a given marker the active marker on the map by adding a class.
		 *
		 * @return {object} The marker for method chaining
		 */
		marker.setActive = function() {
			marker.map.clearActiveMarker();

			this
				.removeClass(MARKER_CLASS_CLICKED)
				.addClass(MARKER_CLASS_CLICKED + MARKER_CLASS_ACTIVE);

			return this;
		}
		/**
		 * Removes the active class form a marker.
		 *
		 * @return {object} The marker for method chaining
		 */
		marker.clearActive = function() {
			this.removeClass(MARKER_CLASS_ACTIVE);

			return this;
		}
		/**
		 * Adds a class to a marker.
		 *
		 * @param {string} className The class to add
		 * @return {object} The marker for method chaining
		 */
		marker.addClass = function(className) {
			var markerClass = this.get('labelClass');

			this.set('labelClass', markerClass + className);

			return this;
		}
		/**
		 * Removes a class from a marker.
		 *
		 * @param {string} className The class to remove
		 * @return {object} The marker for method chaining
		 */
		marker.removeClass = function(className) {
			var markerClass = this.get('labelClass').replace(className, '');

			this.set('labelClass', markerClass);

			return this;
		}

		map.addMarker(marker, markerLocation);
		updateMakerEvents(marker, successCallback, onclickFunction);
	}
	/**
	 * Updates the marker events for a given marker, adds the onclick function,
	 * and fires the success callback passing in the marker.
	 *
	 * @param {object} marker A MarkerWithLabel object
	 * @param {function} successCallback The callback for geolocation success
	 * @param {function} onclickFunction The function to fire on marker click
	 * @return {void}
	 */
	function updateMakerEvents(marker, successCallback, onclickFunction) {
		Dispatcher.fireCallbacks([successCallback], marker);

		GoogleMapsApi.event.addListener(marker, "mouseover", function() {
			marker.addClass(MARKER_CLASS_HOVER);
		});

		GoogleMapsApi.event.addListener(marker, "mouseout", function() {
			marker.removeClass(MARKER_CLASS_HOVER);
		});

		if ($.isFunction(onclickFunction)) {
			GoogleMapsApi.event.addListener(marker, "click", function() {
				onclickFunction(marker);
			});
		}
	}
	/**
	 * A wrapper to pass the Google Maps LatLng object from the results into
	 * addMarkerToMap.
	 *
	 * @param {object} results The first results from Google Maps
	 * @param {function} successCallback The callback for geolocation success
	 * @param {object} map A Google Map object
	 * @param {object} settings The settings object in adding a marker
	 * @param {function} onclickFunction The function to fire on marker click
	 * @return {void}
	 */
	function geolocateCallbackMarker(result, successCallback, map, settings, onclickFunction) {
		addMarkerToMap(
			result.geometry.location,
			successCallback,
			map,
			settings,
			onclickFunction
		);
	}

	return {
		/**
		 * Adds a map to a element with the given id.
		 *
		 * @param {string} id The element id
		 * @param {object} center A Google map LatLng object
		 * @param {object} settings A settings object for Google Maps without the center set
		 * @return {object} Google Maps object
		 */
		buildMap: buildMap,
		/**
		 * Gets a Google Maps LatLng object for a coma delimited set of lat and lng.
		 *
		 * @param {string} latLng A coma delimited set of lat and lng
		 * @return {object} A Google Maps LatLng object
		 */
		getLatLng: getLatLngObj,
		/**
		 * Gets a normalized location object a given lat lng and fires the
		 * corresponding callbacks. Returns void because the normalized location
		 * object is passed to the success callback.
		 *
		 * @param {string} module Name of module requesting geolocation
		 * @param {string} latLng The coma delimited lat lng string to geolocate
		 * @param {function} successCallback The callback for geolocation success
		 * @param {function} failureCallback The callback for geolocation failure
		 * @return {void}
		 */
		getLocationFromLatLng: function(module, latLng, successCallback, failureCallback) {
			addToGeolocateQueue(
				module,
				'latLng',
				getLatLngObj(latLng),
				geolocateCallbackLocation,
				successCallback,
				failureCallback
			);
		},
		/**
		 * Gets a normalized location object a given address and fires the
		 * corresponding callbacks. Returns void because the normalized location
		 * object is passed to the success callback.
		 *
		 * @param {string} module Name of module requesting geolocation
		 * @param {string} address The aaddress to geolocate
		 * @param {function} successCallback The callback for geolocation success
		 * @param {function} failureCallback The callback for geolocation failure
		 * @return {void}
		 */
		getLocationFromAddress: function(module, address, successCallback, failureCallback) {
			geolocateByAddress(
				module,
				address,
				geolocateCallbackLocation,
				successCallback,
				failureCallback
			);
		},
		/**
		 * Adds a marker for a given lat and lng and fires the corresponding
		 * callbacks. Returns void because the marker object is passed to the
		 * success callback. This is the prefered method as it is not
		 * restricted by the Google Maps geocoder query limit.
		 *
		 * @param {string} module Name of module requesting geolocation
		 * @param {string} latLng The coma delimited lat lng string to geolocate
		 * @param {function} successCallback The callback for geolocation success
		 * @param {function} failureCallback The callback for geolocation failure
		 * @param {object} map A Google Map object
		 * @param {object} settings The settings object in adding a marker
		 * @param {function} onclickFunction The function to fire on marker click
		 * @return {void}
		 */
		addMarkerFromLatLng: function(module, latLng, successCallback, failureCallback, map, settings, onclickFunction) {
			addMarkerToMap(
				getLatLngObj(latLng),
				successCallback,
				map,
				settings,
				onclickFunction
			)
		},
		/**
		 * Adds a marker for a given address and fires the corresponding
		 * callbacks. Returns void because the marker object is passed to the
		 * success callback. This is request will be put in a queue to not
		 *
		 * @param {string} module Name of module requesting geolocation
		 * @param {string} address The aaddress to geolocate
		 * @param {function} successCallback The callback for geolocation success
		 * @param {function} failureCallback The callback for geolocation failure
		 * @param {object} map A Google Map object
		 * @param {object} settings The settings object in adding a marker
		 * @param {function} onclickFunction The function to fire on marker click
		 * @return {void}
		 */
		addMarkerFromAddress: function(module, address, successCallback, failureCallback, map, settings, onclickFunction) {
			geolocateByAddress(
				module,
				address,
				geolocateCallbackMarker,
				successCallback,
				failureCallback,
				map,
				settings,
				onclickFunction
			);
		}
	}
});