'use strict';

/**
 * This is the dispatcher helper object that handles callback queues.
 *
 * @author Chris Lock
 *
 * @return {object} Public methods.
 */
define([], function() {
	/**
	 * Fires a callback if it is a function and passes the callback a parameter
	 * from the helper.
	 *
	 * @param {function} funciton The callback function.
	 * @param {mixed} parameters The parameter or parameters the helper passes the callback.
	 * @return {void}
	 */
	function fireCallback(callback, parameters) {
		if (isFunction(callback)) {
			callback.apply(this, parameters);
		}
	}
	/**
	 * Checks if a variable is a function.
	 *
	 * @param {function} functionToCheck The module to call the method on
	 * @return {bool} Is it a function
	 */
	function isFunction(functionToCheck) {
		var getType = {};

		return (functionToCheck && getType.toString.call(functionToCheck) === '[object Function]');
	}

	return {
		/**
		 * Loops through the callback queue and passes them to fireCallback
		 *
		 * @param {array} callbacks The queue of callback functions.
		 * @param {mixed} parameters The parameter or parameters the helper passes the callback.
		 * @return {void}
		 */
		fireCallbacks: function() {
			var args = Array.prototype.slice.call(arguments),
				callbacks = args.shift(),
				callbacksLength = callbacks.length;

			for (var i = 0; i < callbacksLength; i++) {
				fireCallback(callbacks[i], args);
			}
		}
	};
});