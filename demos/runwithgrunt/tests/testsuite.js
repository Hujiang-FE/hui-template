function testWidgetDefaults(widget, defaults) {
	var pluginDefaults = $.extend({},
		HUI.widgets[widget].prototype.options
	);
	
	// ensure that all defaults have the correct value
	test('defined defaults', function() {
		$.each(defaults, function(key, val) {
			if ($.isFunction(val)) {
				ok(val !== undefined, key);
				return;
			}
			deepEqual(pluginDefaults[key], val, key);
		});
	});
	
	// ensure that all defaults were tested
	test('tested defaults', function() {
		$.each(pluginDefaults, function(key, val) {
			ok(key in defaults, key);
		});
	});
}

function testWidgetOverrides(widget) {
	test('hui.Widget overrides', function() {
		$.each(['_createWidget', 'option', '_trigger'], function(i, method) {
		    ok(HUI.Widget.prototype[method] == HUI.widgets[widget].prototype[method],
				'should not override ' + method);
		});
	});
}

function commonWidgetTests(widget, settings) {
	module(widget + ": common widget");

	$.each(HUI.Widget.prototype.options, function (key, value) {
		if (!(key in settings.defaults)) {
			settings.defaults[key] = value;
		}
	});

	testWidgetDefaults(widget, settings.defaults);
	testWidgetOverrides(widget);
}