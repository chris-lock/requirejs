define([], function() {
	var REQUEST_INTERVAL = 1;

	var vendors = [
			'webkit',
			'moz',
			'o',
			'ms'
		],
		isSupported = false;

	function load() {
		setRequestAnimationFrameMethods();
		setRequestAnimationFrameFallbacks();
	}

	function setRequestAnimationFrameMethods() {
		var vendor = '';

		for (var i = vendors.length - 1; i > -1 && !window.requestAnimationFrame; i--) {
			vendor = vendors[i];

			window.requestAnimationFrame = window[vendor + 'RequestAnimationFrame'];
			window.cancelAnimationFrame = window[vendor + 'CancelAnimationFrame']
				|| window[vendor + 'CancelRequestAnimationFrame'];
		}
	}

	function setRequestAnimationFrameFallbacks() {
		if (!window.requestAnimationFrame) {
			window.requestAnimationFrame = function(callback) {
				return setTimeout(callback, REQUEST_INTERVAL);
			};
		} else {
			isSupported = true;
		}

		if (!window.cancelAnimationFrame) {
			window.cancelAnimationFrame = function(requestId) {
				clearTimeout(requestId);
			};
		}
	}

	load();

	return {
		request: function(callback, callImmediately) {
			if (callImmediately) {
				callback();

				return null;
			}

			return requestAnimationFrame(callback);
		},
		cancel: function(requestId) {
			cancelAnimationFrame(requestId);
		},
		isSupported: function() {
			return isSupported;
		}
	};
});