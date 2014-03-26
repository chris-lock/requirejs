/**
 * Adds nth-child class to avoid issues with legacy values. Uses 'data-nth_child'
 * so 'data-nth_child="li:nth-child(3n-1)"' would add the class 
 * 'nth-child-3n-minus-1' to the 2nd, 5th, 8th items and so on. You can target 
 * mutiple selectors by seperating them by a coma.
 *
 * @author Chris Lock
 *
 * @param {object} jquery jQuery library.
 * @return {object} Public methods.
 */
 define([], function() {
		/** @constant The nth-child data attr. */
	var	DATA_NTH_CHILD = 'data-nth_child',
		/** @constant The class added once loaded. */
		LOADED_CLASS = '_loaded',
		/** @constant The selector of loaded elements. */
		LOADED_SELECTOR = '.' + LOADED_CLASS,
		/** @constant The replacement for nth+. */
		NTH_PLUS = '-plus-',
		/** @constant The replacement for nth-. */
		NTH_MINUS = '-minus-',
		/** @constant The base used to create the class. */
		NTH_CLASS_BASE = 'nth-child-{{NTH_SELECTOR}}';

	/**
	 * Adds nth-child classes.
	 *
	 * @return {void}
	 */
	function load() {
		var nthParents = document.querySelectorAll('[' + DATA_NTH_CHILD + ']');

		for (var i = nthParents.length - 1; i > -1; i--)
			addNthClass(nthParents[i]);
	}
	/**
	 * Adds nth-child classes to each element.
	 *
	 * @param {object} elem The parent of the nth-children
	 * @return {void}
	 */
	function addNthClass(elem) {
		var nthCssSelectors = elem.getAttribute(DATA_NTH_CHILD).split(','),
			nthCssSelector = '',
			nthChildren = '';

		for (var i = nthCssSelectors.length - 1; i > -1; i--) {
			nthCssSelector = nthCssSelectors[i],
			nthChildren = elem.querySelectorAll(nthCssSelector);

			for (var j = nthChildren.length - 1; j > -1; j--)
				addClass(
					nthChildren[j],
					getNthChildClass(nthCssSelector)
				);
		}
	}
	/**
	 * Gets the selector as a valid css class.
	 *
	 * @param {string} nthCssSelector The selector we want to add the class to
	 * @return {string} Returns the class to add the the nth-child
	 */
	function getNthChildClass(nthCssSelector) {
		var nthCssSelectors = nthCssSelector.replace(')', '').split(':nth-child('),
			nthSelector = nthCssSelectors.pop();
		
		nthSelector = nthSelector
			.replace(' ', '')
			.split('-')
			.join(NTH_MINUS)
			.split('+')
			.join(NTH_PLUS);

		return NTH_CLASS_BASE
			.replace('{{NTH_SELECTOR}}', nthSelector);
	}
	/**
	 * Adds a class to an element.
	 *
	 * @param {object} elem The element
	 * @param {string} className The class to add
	 * @return {void}
	 */
	function addClass(elem, className) {
		if (elem.classList)
			elem.classList.add(className);
		else
			elem.className += ' ' + className;
	}
	/**
	 * All modules should load themselves.
	 */
	load();

	return {
		/**
		 * Making the load function public for ajax
		 *
		 * @return {void}
		 */
		load: load
	};
});