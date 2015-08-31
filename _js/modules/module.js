'use strict';

define(['jquery'], function($) {
	return function(module) {
		var instances = [],
			hasInstanceProperties = false,
			instanceProperties = [];

		function load(elem) {
			var $elem = $(elem);

			var	instance = createInstance($elem, module.call(this, $elem, $)),
				instanceModule = instance.module;

			instanceModule.load();
			instances.push(instance);

			setInstanceProperties(instanceModule);
		}

		function createInstance($elem, module) {
			return {
				$elem: $elem,
				module: module
			};
		}

		function setInstanceProperties(baseInstanceModule) {
			if (hasInstanceProperties) {
				return;
			}

			for (var property in baseInstanceModule) {
				if (!instances[property] && baseInstanceModule.hasOwnProperty(property)) {
					instanceProperties.push(property);
				}
			}

			hasInstanceProperties = true;
		}

		function getInstances(filterMethod) {
			var module = {};

			return setInstanceArrayProperties(
				$.map(instances, function(instance) {
					module = instance.module;

					if (filterMethod(instance.$elem, module)) {
						return module;
					}
				})
			);
		}

		function setInstanceArrayProperties(instanceArray) {
			$.each(instanceProperties, function(index, property) {
				instanceArray[property] = setInstanceProperty(instanceArray, property);
			});

			return instanceArray;
		}

		function setInstanceProperty(instanceArray, property) {
			return function() {
				return $.map(instanceArray, function(instance) {
					return instance[property].apply(null, arguments);
				});
			};
		}

		return {
			load: load,
			all: function() {
				return getInstances(function() {
					return true;
				});
			},
			find: getInstances,
			findBySelector: function(selector) {
				return getInstances(function($elem) {
					return $elem.is(selector);
				});
			}
		};
	};
});