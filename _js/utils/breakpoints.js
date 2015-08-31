'use strict';

/**
 * The breakpoints utility gets breakpoints from div.breakpoints in the DOM
 * that have a data-breakpoint attribute. CSS should set all breakpoints to
 * display: none with the exception of the div with a class named after the
 * current breakpint.
 *
 *		<div class="breakpoint standard" data-breakpoint="standard"></div>
 *		<div class="breakpoint large" data-breakpoint="large"></div>
 *		<div class="breakpoint medium" data-breakpoint="medium"></div>
 *		<div class="breakpoint small" data-breakpoint="small"></div>
 *
 * @author Chris Lock
 *
 * @param {object} Dispatcher Dispatcher utility.
 * @param {object} Viewport Viewport utility.
 * @return {object} Public methods.
 */
define(['Dispatcher', 'Viewport'], function(Dispatcher, Viewport) {
		/** @constant The class on breakpoint divs. */
	var BREAKPOINT_CLASS = '.breakpoint',
		/** @constant The data attribute on breakpoint divs. */
		BREAKPOINT_DATA = 'data-breakpoint';

		/** @type {object} Breakpoints object. */
	var breakpoints = {},
		/** @type {object} Callback queue for change, enter, and leave events. */
		callbacks = {
			change: [],
			load: {},
			enter: {},
			leave: {}
		};

		/** @type {object} Object containing all breakpoint divs. */
	var breakpointDivs = document.querySelectorAll(BREAKPOINT_CLASS);

	/**
	 * Sets the breakpoints and binds the Viewport.resize event.
	 *
	 * @return {void}
	 */
	function load() {
		breakpoints = getBreakpoints();

		Viewport.resize(fireBreakpointCallbacks);
	}
	/**
	 * Gets the breakpoints as an object with each breakpoint as a parameter
	 * set to true or false depending on if it is active.
	 *
	 * @return {object} Breakpoints object.
	 */
	function getBreakpoints() {
		var breakpointsNew = {};

		forEach(breakpointDivs, function(breakpointDiv) {
			breakpointsNew[breakpointDiv.getAttribute(BREAKPOINT_DATA)] = isVisible(breakpointDiv);
		});

		return breakpointsNew;
	}
	/**
	 * Calls a method passing each item in an array as a parameter.
	 *
	 * @param {array} array The array
	 * @param {function} method The method to call on each item
	 * @return {void}
	 */
	function forEach(array, method) {
		for (var i = array.length - 1; i > -1; i--) {
			method(array[i]);
		}
	}
	/**
	 * Fires all the enter or leave callbacks for set of breakpoints.
	 *
	 * @param {string} event The enter or leave event.
	 * @param {array} breakpoints The breakpoints for which callbacks should be fired.
	 * @return {void}
	 */
	function fireEventCallbacks(event, breakpoints) {
		forEach(breakpoints, function(breakpointCurrent) {
			if (callbacks[event][breakpointCurrent]) {
				Dispatcher.fireCallbacks(callbacks[event][breakpointCurrent], breakpointCurrent);
			}
		});
	}
	/**
	 * Determines if an element is visible.
	 *
	 * @param {object} elem The element to check
	 * @return {object} Element is visible.
	 */
	function isVisible(elem) {
		return (elem.offsetWidth !== 0 || elem.offsetHeight !== 0);
	}
	/**
	 * Checks if breakpoints have changed and fires their respective events.
	 *
	 * @return {void}
	 */
	function fireBreakpointCallbacks() {
		var breakpointsChanged = getBreakpointsChanged();

		if (breakpointsChanged.entered.length || breakpointsChanged.left.length) {
			breakpoints = getBreakpoints();

			Dispatcher.fireCallbacks(callbacks.change);
		}

		fireEventCallbacks('enter', breakpointsChanged.entered);
		fireEventCallbacks('leave', breakpointsChanged.left);
	}
	/**
	 * Checks if breakpoints have changed and, if so, which have been entered
	 * and which have been left.
	 *
	 * @return {object} Object with properties enetred and left that contain arrays of the respective breakpoints
	 */
	function getBreakpointsChanged() {
		var breakpointsNew = getBreakpoints(),
			breakpointsChanged = {
				entered: [],
				left: []
			};

		for (var breakpoint in breakpointsNew) {
			if (breakpoints[breakpoint] !== breakpointsNew[breakpoint]) {
				if (breakpointsNew[breakpoint]) {
					breakpointsChanged.entered.push(breakpoint);
				} else {
					breakpointsChanged.left.push(breakpoint);
				}
			}
		}

		return breakpointsChanged;
	}
	/**
	 * Added a callback for the breakpoint for either the enter or leave event.
	 *
	 * @param {string} event The enter or leave event.
	 * @param {array} breakpoints The breakpoints to add the events for.
	 * @param {function} callback The callback to add to the queue.
	 * @return {void}
	 */
	function addCallbackToEvent(event, breakpoints, callback) {
		forEach(breakpoints, function(breakpoint) {
			if (!callbacks[event][breakpoint]) {
				callbacks[event][breakpoint] = [];
			}

			callbacks[event][breakpoint].push(callback);
		});
	}
	/**
	 * Returns enter and leave methods for adding events to multiple breakpoints.
	 *
	 * @param {array} breakpoints The breakpoints to add events to.
	 * @return {object} The enter and leave methods
	 * 		@return {object} The forEach object
	 */
	function forEachBreakpoint(breakpoints) {
		return {
			load: function(callback) {
				fireLoadEvents(breakpoints, callback);

				return forEachBreakpoint(breakpoints);
			},
			enter: function(callback) {
				addCallbackToEvent('enter', breakpoints, callback);

				return forEachBreakpoint(breakpoints);
			},
			leave: function(callback) {
				addCallbackToEvent('leave', breakpoints, callback);

				return forEachBreakpoint(breakpoints);
			}
		};
	}
	/**
	 * Calls the load event on all active breakpoints.
	 *
	 * @param {array} loadBreakpoints The breakpoints to add the events for.
	 * @param {function} callback The callback to call if loaded.
	 * @return {void}
	 * 		@return {string} The current breakpoint
	 */
	function fireLoadEvents(loadBreakpoints, callback) {
		forEach(loadBreakpoints, function(loadBreakpoint) {
			if (breakpoints[loadBreakpoint]) {
			 	Dispatcher.fireCallbacks([callback], loadBreakpoint);
			}
		});
	}
	/**
	 * All utils should load themselves.
	 */
	load();

	return {
		/**
		 * Adds a function to the callbacks.change queue.
		 *
		 * @param {function} function The callback function to add to the callbacks.change queue.
		 * @return {object} This for method chaining
		 */
		change: function(callback) {
			callbacks.change.push(callback);

			return this;
		},
		/**
		 * Adds a function for a breakpoint in the callback.enter queue.
		 *
		 * @param {string} breakpoint The breakpoint to add the enter callback for.
		 * @param {function} function The callback function to add to the callbacks.change queue.
		 * @return {object} This for method chaining
		 * 		@return {string} The current breakpoint
		 */
		enter: function(breakpoint, callback) {
			addCallbackToEvent('enter', [breakpoint], callback);

			return this;
		},
		/**
		 * Adds a function for a breakpoint in the callback.leave queue.
		 *
		 * @param {string} breakpoint The breakpoint to add the leave callback for.
		 * @param {function} function The callback function to add to the callbacks.change queue.
		 * @return {object} This for method chaining
		 * 		@return {string} The current breakpoint
		 */
		leave: function(breakpoint, callback) {
			addCallbackToEvent('leave', [breakpoint], callback);

			return this;
		},
		/**
		 * Returns enter and leave methods for adding events to multiple breakpoints.
		 *
		 * @param {array} breakpoints The breakpoints to add events to.
		 * @return {object} The enter and leave methods
		 * 		@return {object} The forEach object
		 */
		forEach: forEachBreakpoint,
		/**
		 * Returns enter and leave methods for adding events to all breakpoints.
		 *
		 * @return {object} The enter and leave methods
		 * 		@return {object} The forEach object
		 */
		all: function() {
			var allBreakpoints = [];

			for (var breakpoint in breakpoints) {
				allBreakpoints.push(breakpoint);
			}

			return forEachBreakpoint(allBreakpoints);
		},
		/**
		 * Checks is a breakpoint is active.
		 *
		 * @param {string} breakpoint The breakpoint to check.
		 * @return {bool} The breakpoint is or isn't active.
		 */
		is: function(breakpoint) {
			return (breakpoints[breakpoint] !== undefined && breakpoints[breakpoint]);
		}
	};
});