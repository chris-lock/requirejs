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

		for (var i = nthParents.length - 1; i > -1; i--) {
			addNthClasses(nthParents[i]);
		}
	}
	/**
	 * Adds nth-child classes to each element.
	 *
	 * @param {object} elem The parent of the nth-children
	 * @return {void}
	 */
	function addNthClasses(elem) {
		var nthCssSelectors = elem.getAttribute(DATA_NTH_CHILD).split(', ').join(',').split(','),
			nthCssSelector = '',
			nthChildClass = '';

		for (var i = nthCssSelectors.length - 1; i > -1; i--) {
			nthCssSelector = nthCssSelectors[i];
			nthChildClass = getNthChildClass(nthCssSelector);

			removeOldNthChildrenClass(elem, nthChildClass);
			addNthClass(elem, nthCssSelector, nthChildClass);
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
	 * Gets the selector as a valid css class.
	 *
	 * @param {object} elem The parent of the nth-children
	 * @param {string} nthChildClass The class added to nth children
	 * @return {void}
	 */
	function removeOldNthChildrenClass(elem, nthChildClass) {
		updateElementClass(
			elem.querySelectorAll(nthChildClass),
			removeClass,
			nthChildClass
		);
	}
	/**
	 * Adds or removes a class for a given selector.
	 *
	 * @param {array} elems An array of elements
	 * @param {function} classMethod The method name either addClass or removeClass
	 * @param {string} className The class to add or remove
	 * @return {void}
	 */
	function updateElementClass(elems, classMethod, className) {
		for (var i = elems.length - 1; i > -1; i--)
			classMethod.call(
				null,
				elems[i],
				className
			);
	}
	/**
	 * Removes a class to an element.
	 *
	 * @param {object} elem The element
	 * @param {string} className The class to add
	 * @return {void}
	 */
	function removeClass(elem, className) {
		if (elem.classList)
			elem.classList.remove(className);
		else
			elem.className = elem.className.split(className).join('').replace('  ', ' ').replace(/^\s+|\s+$/g, '');
	}
	/**
	 * Gets the selector as a valid css class.
	 *
	 * @param {object} elem The parent of the nth-children
	 * @param {string} nthCssSelector The selector we want to add the class to
	 * @param {string} nthChildClass The class added to nth children
	 * @return {void}
	 */
	function addNthClass(elem, nthCssSelector, nthChildClass) {
		updateElementClass(
			elem.querySelectorAll(nthCssSelector),
			addClass,
			nthChildClass
		);
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
			elem.className = elem.className.split(' ').push(className).join(' ');
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