'use strict';

/**
 * Adds nth-child class to avoid issues with legacy values. Uses 'data-nth_child'
 * so 'data-nth_child="li:nth-child(3n-1)"' would add the class
 * 'nth-child-3n-minus-1' to the 2nd, 5th, 8th items and so on. You can target
 * mutiple selectors by seperating them by a coma.
 *
 * @author Chris Lock
 *
 * @param {object} jquery jQuery library.
 * @param {object} Loader Loader utility.
 * @return {object} Public methods.
 */
 define(['jquery', 'Loader'], function($, Loader) {
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
	 * Registers the util method with the Loader and adds classes to existing
	 * elements.
	 *
	 * @param {object} $element The element to look inside for nth-child elements
	 * @return {void}
	 */
	function load() {
		Loader.registerUtilMethod(updateNthChildElements);
		updateNthChildElements($(document));
	}
	/**
	 * Adds nth-child classes to elements.
	 *
	 * @param {object} $element The element to look inside for nth-child elements
	 * @return {void}
	 */
	function updateNthChildElements($element) {
		var nthChildSelector = '[' + DATA_NTH_CHILD + ']';

		$element
			.find(nthChildSelector)
			.addBack(nthChildSelector)
			.not(LOADED_SELECTOR)
			.each(addNthClass);
	}
	/**
	 * Adds nth-child classes to each element.
	 *
	 * @return {void}
	 */
	function addNthClass() {
		var $this = $(this);
		var nthCssSelectors = $this.attr(DATA_NTH_CHILD).split(','),
			nthCssSelectorsLength = nthCssSelectors.length,
			nthCssSelector = '',
			nthClass = '';


		for (var i = 0; i < nthCssSelectorsLength; i++) {
			nthCssSelector = nthCssSelectors[i];
			nthClass = getNthChildClass(nthCssSelector);

			$(this).find(nthCssSelector).addClass(nthClass);
		}
	}
	/**
	 * Gets teh selector as a valid css class.
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
	 * All modules should load themselves.
	 */
	load();

	return {
		/**
		 * Making the load function public for ajax
		 *
		 * @return {void}
		 */
		load: updateNthChildElements
	};
});