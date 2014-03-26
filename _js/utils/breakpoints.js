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
 * @param {object} jquery jQuery library.
 * @param {object} dispatcher Dispatcher utility.
 * @param {object} viewport Viewport utility.
 * @return {object} Public methods.
 */
define(['dispatcher', 'viewport'], function(dispatcher, viewport) {
		/** @type {object} Breakpoints object. */
	var breakpoints = {},
		/** @type {object} Callback queue for change, enter, and leave events. */
		callbacks = {
			change: [],
			enter: {},
			leave: {}
		};

		/** @type {object} Object containing all breakpoint divs. */
	var breakpointDivs = document.querySelectorAll('.breakpoint');

	/**
	 * Sets the breakpoints and binds the viewport.resize event.
	 *
	 * @return {void}
	 */
	function load() {
		breakpoints = getBreakpoints();
		
		viewport.resize(fireBreakpointCallbacks);
	}
	/**
	 * Gets the breakpoints as an object with each breakpoint as a parameter
	 * set to true or false depending on if it is active.
	 *
	 * @return {object} Breakpoints object.
	 */
	function getBreakpoints() {
		var breakpointsNew = {};

		var breakpointDiv = {};

		for (var i = breakpointDivs.length - 1; i > -1; i--) {
			breakpointDiv = breakpointDivs[i];

			breakpointsNew[breakpointDiv.getAttribute('data-breakpoint')] = isVisible(breakpointDiv);
		}

		return breakpointsNew;
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
			breakpoints = breakpointsNew;

			dispatcher.fireCallbacks(callbacks.change);
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
				if (breakpointsNew[breakpoint])
					breakpointsChanged.entered.push(breakpoint);
				else
					breakpointsChanged.left.push(breakpoint);
			}
		}

		return breakpointsChanged;
	}
	/**
	 * Fires all the enter or leave callbacks for set of breakpoints.
	 *
	 * @param {string} event The enter or leave event.
	 * @param {array} breakpoints The breakpoints for which callbakcs should be fired.
	 * @return {void}
	 */
	function fireEventCallbacks(event, breakpoints) {
		var breakpointCurrent = '',
			breakpointCallbacks = [];

		for (var i = breakpoints.length - 1; i > -1; i--) {
			breakpointCurrent = breakpoints[i];

			if (callbacks[event][breakpointCurrent]) {
				breakpointCallbacks = callbacks[event][breakpointCurrent];
				
				dispatcher.fireCallbacks(breakpointCallbacks, breakpointCurrent);
			}
		}
	}
	/**
	 * Added a callback for the breakpoint for either the enter or leave event.
	 *
	 * @param {string} event The enter or leave event.
	 * @param {string} breakpoint The breakpoint to add the event for.
	 * @param {function} callback The callback to add to the queue.
	 * @return {void}
	 */
	function addCallbackToEvent(event, breakpoint, callback) {
		if (!callbacks[event][breakpoint])
			callbacks[event][breakpoint] = [];
		
		callbacks[event][breakpoint].push(callback);
	}
	/**
	 * All modules should load themselves.
	 */
	load();

	return {
		/**
		 * Adds a function to the callbacks.change queue.
		 *
		 * @param {function} function The callback function to add to the callbacks.change queue.
		 * @return {void}
		 */
		change: function(callback) {
			callbacks.change.push(callback);
		},
		/**
		 * Adds a function for a breakpoint in the callback.enter queue.
		 *
		 * @param {string} breakpoint The breakpoint to add the enter callback for.
		 * @param {function} function The callback function to add to the callbacks.change queue.
		 * @return {void}
		 */
		enter: function(breakpoint, callback) {
			addCallbackToEvent('enter', breakpoint, callback);
		},
		/**
		 * Adds a function for a breakpoint in the callback.leave queue.
		 *
		 * @param {string} breakpoint The breakpoint to add the leave callback for.
		 * @param {function} function The callback function to add to the callbacks.change queue.
		 * @return {void}
		 */
		leave: function(breakpoint, callback) {
			addCallbackToEvent('leave', breakpoint, callback);
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