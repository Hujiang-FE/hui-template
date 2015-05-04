/*!
 * hui.widgets.js 1.0.0 (2015-01-23, 16:49)
 Copyright (C) 2014 Hujiang.com, http://ww.hujiang.com */
/*global jQuery*/

(function(global) {
    "use strict";
    var hui = global.HUI = global.HUI || {},

        __hasProp = Object.prototype.hasOwnProperty,
        __typeof = Object.prototype.toString,
        __slice = Array.prototype.slice,
        __isPlainObject = function(obj) { // copyed from jquery
            /* jshint eqeqeq: false */
            // Must be an Object.
            // Because of IE, we also have to check the presence of the constructor property.
            // Make sure that DOM nodes and window objects don't pass through, as well
            if (!obj || __typeof.call(obj) !== '[object Object]' ||
                obj.nodeType || (obj != null && obj == obj.window)) {
                return false;
            }

            try {
                // Not own constructor property must be Object
                if (obj.constructor &&
                    !__hasProp.call(obj, "constructor") &&
                    !__hasProp.call(obj.constructor.prototype, "isPrototypeOf")) {
                    return false;
                }
            } catch (e) { // IE8,9 Will throw exceptions on certain host objects #9897
                return false;
            }
            var key;
            for (key in obj) {}

            return key === undefined || __hasProp.call(obj, key);
        },

        __extend = function(target) { //deep clone on plain object
            var input = __slice.call(arguments, 1),
                key,
                value;
            for (var i = 0, length = input.length; i < length; i++) {
                for (key in input[i]) {
                    value = input[i][key];
                    if (input[i].hasOwnProperty(key) && value !== undefined) {
                        // Clone objects
                        if (__isPlainObject(value)) {
                            target[key] = __isPlainObject(target[key]) ?
                                __extend({}, target[key], value) :
                            // Don't extend strings, arrays, etc. with objects
                            __extend({}, value);
                            // Copy everything else by reference
                        } else {
                            target[key] = value;
                        }
                    }
                }
            }
            return target;
        },

        __bridge = function(name, Widget) { //jquery bridge

            if (!window.jQuery) return;

            jQuery.fn[name] = function(options) {
                var isMethod = typeof options === "string",
                    args = __slice.call(arguments, 1),
                    returnVal = this;

                if (isMethod) {
                    this.each(function() {
                        var result,
                            instance = jQuery(this).data(name);
                        if (!instance) {
                            throw 'Cannot call method before ' + name + ' initialized!';
                        }
                        if (typeof instance[options] !== 'function') {
                            throw 'There is no method called ' + options;
                        }
                        result = instance[options].apply(instance, args);

                        if (result !== instance && result !== undefined) {
                            //The result will be pushed into jqueryStack, 
                            //if this methods return jquery instance.
                            // (这里支持jquery 破坏性操作 后可以通过end方法返回原来状态)
                            returnVal = result && result.jquery ?
                                returnVal.pushStack(result.get()) :
                                result;
                            return false;
                        }

                    });
                } else {
                    //create and save widget instance to jq.data
                    this.each(function() {
                        var $this = jQuery(this);
                        var data = new Widget($this, options);

                        $this.data(name, data);
                    });

                }
                return returnVal;
            };
        },

        __attrDeclare = function() {
            $(window).on('load', function() {
                var widgets = hui.widgets;
                $('[hui]').each(function() {
                    var $widget = $(this),
                        widgetName;

                    widgetName = $widget.attr("hui");
                    if (widgets[widgetName]) {
                        $widget["hui" + widgetName]();
                    }
                });
            });
        },

        __registerWidget = function(name, prototype) {

            var base, baseProto, Widget = hui.widgets[name] = function(element, options) {
                this._createWidget(element, options);
            };

            base = this;

            var widgetName = name,
                fullName = 'hui' + widgetName;

            for (var key in base) {
                if (__hasProp.call(base, key)) Widget[key] = base[key];
            }

            function Ctor() {
                this.constructor = Widget;
            }
            Ctor.prototype = base.prototype;
            baseProto = new Ctor();
            Widget.__super__ = base.prototype;
            //clone object
            baseProto.options = __extend({}, baseProto.options);

            // extand protoObj and other property to widget.prototype
            Widget.prototype = __extend(baseProto, prototype, {
                widgetName: widgetName,
                widgetFullName: fullName

            });

            //jquery bridge
            __bridge(fullName, Widget);
        },

        widget_uuid = 0;


    hui.define = function(depends, factory) {
        if (typeof define === "function" && define.amd) {
            define(depends, factory);
        } else {
            factory(this);
        }
    };

    hui.widgets = {};
    hui.widgetInstances = {};
    //Base class of all widgets
    hui.Widget = function( /*element, options*/ ) {};

    hui.Widget.prototype = {
        widgetName: 'widget',
        widget: function() {
            return this.element;
        },
        options: {
            enabled: true
        },

        _createWidget: function(element, options) {

            this.options = __extend({},
                this.options,
                options);

            this.element = element;
            this.uuid = widget_uuid++;
            this.ns = "." + this.widgetName + this.uuid;

            this._create();
            this._trigger("create", null, this._getCreateEventData());

            this._init();
            hui.widgetInstances[this.uuid + ''] = this;
        },
        
        _getCreateEventData: function() {
            return {
                el: this.element
            }
        },
        _create: function() {},
        _init: function() {},
        _destroy: function() {},

        _trigger: function(type, event, args) {
            var prop, orig, callback = this.options[type];

            event = $.Event( event );
            event.type = type.toLowerCase();
            event.target = this.element[ 0 ];

            orig = event.originalEvent;
            if ( orig ) {
                for ( prop in orig ) {
                    if ( !( prop in event ) ) {
                        event[ prop ] = orig[ prop ];
                    }
                }
            }

            if (typeof callback === 'function') {
                return callback.call(this.element[0], event, args);
            }
        },

        option: function(key, value) {// copyed from jqui
            var options = key, parts, curOption, i;

            if (typeof key === "string") {
                // handle nested keys, e.g., "foo.bar" => { foo: { bar: ___ } }
                options = {};
                parts = key.split(".");
                key = parts.shift();
                if (parts.length) {
                    curOption = options[key] = $.widget.extend({}, this.options[key]);
                    for (i = 0; i < parts.length - 1; i++) {
                        curOption[parts[i]] = curOption[parts[i]] || {};
                        curOption = curOption[parts[i]];
                    }
                    key = parts.pop();
                    if (arguments.length === 1) {
                        return curOption[key] === undefined ? null : curOption[key];
                    }
                    curOption[key] = value;
                } else {
                    if (arguments.length === 1) {
                        return this.options[key] === undefined ? null : this.options[key];
                    }
                    options[key] = value;
                }
            }

            this._setOptions(options);

            return this;
        },

        _setOptions: function(options) {
            var key;

            for (key in options) {
                this._setOption(key, options[key]);
            }
            return this;
        },

        _setOption: function( key, value ) {
            this.options[key] = value;
            return this;
        },

        destroy: function() {
            this._destroy();
            this.element.unbind(this.ns)
                .removeData(this.widgetFullName);

            delete hui.widgetInstances[this.uuid + ''];
        }
    };

    hui.Widget.extend = __registerWidget;

    //__attrDeclare();

    (function($) {
        // helpers
        hui.$doc = $(document);
        hui.$win = $(window);
        //hui.isIE    = navigator.userAgent.indexOf("MSIE") > 0;
        hui.isIE = !!window.ActiveXObject || "ActiveXObject" in window;
        hui.typeOf = function(obj) {
            return __typeof.call(obj);
        };

        hui.keyCode = {
            INSERT: 45,             DELETE: 46,             BACKSPACE: 8,
            TAB: 9,                 ENTER: 13,              ESC: 27,
            LEFT: 37,               UP: 38,                 RIGHT: 39,
            DOWN: 40,               END: 35,                HOME: 36,
            SPACEBAR: 32,           PAGEUP: 33,             PAGEDOWN: 34,
            F2: 113,                F10: 121,               F12: 123,
            NUMPAD_PLUS: 107,       NUMPAD_MINUS: 109,      NUMPAD_DOT: 110
        };        

    }(window.jQuery));
    
})(this);
/*global jQuery, window*/
/*
 * jQuery extensions
 * include effect, animation easing.
 * Copyright www.hujiang.com
 * Released under the MIT license.
 *
 */

(function($) {    

    var naNTest = function (num) {
        return isNaN(num) ? 0 : num;
    };

    $.fn.extend({
        disableSelection: function() {
            return this.bind(($.support.selectstart ? "selectstart" : "mousedown") +
                ".disableSelection",
                function(event) {
                    event.preventDefault();
                });
        },

        enableSelection: function() {
            return this.unbind(".disableSelection");
        }
    });


    $.fn.extend({

        scrollParent: function() {
            var scrollParent;

            if ((/msie ([\w.]+)/.test(navigator.userAgent.toLowerCase()) &&
                    (/(static|relative)/).test(this.css('position'))) ||
                (/absolute/).test(this.css('position'))) {
                scrollParent = this.parents().filter(function() {
                    return (/(relative|absolute|fixed)/).test($.css(this, 'position')) && (/(auto|scroll)/).test($.css(this, 'overflow') + $.css(this, 'overflow-y') + $.css(this, 'overflow-x'));
                }).eq(0);
            } else {
                scrollParent = this.parents().filter(function() {
                    return (/(auto|scroll)/).test($.css(this, 'overflow') + $.css(this, 'overflow-y') + $.css(this, 'overflow-x'));
                }).eq(0);
            }

            return (/fixed/).test(this.css('position')) || !scrollParent.length ? $(document) : scrollParent;
        },

        zIndex: function(zIndex) {
            if (zIndex !== undefined) {
                return this.css("zIndex", zIndex);
            }

            if (this.length) {
                var elem = $(this[0]),
                    position, value;
                while (elem.length && elem[0] !== document) {
                    position = elem.css("position");
                    if (position === "absolute" || position === "relative" || position === "fixed") {
                        value = parseInt(elem.css("zIndex"), 10);
                        if (!isNaN(value) && value !== 0) {
                            return value;
                        }
                    }
                    elem = elem.parent();
                }
            }

            return 0;
        },

        leftBorderWidth: function() {
            var blw = parseFloat($(this).css("borderLeftWidth"));
            var pl = parseFloat($(this).css("padding-left"));
            var ml = 0;
            if ($(this).css("margin-left") != "auto") {
                ml = parseFloat($(this).css("margin-left"));
            }

            return naNTest(blw) + naNTest(pl) + naNTest(ml);
        },

        rightBorderWidth: function() {
            var brw = parseFloat($(this).css("borderRightWidth"));
            var pr = parseFloat($(this).css("padding-right"));
            var mr = 0;
            if ($(this).css("margin-right") != "auto") {
                mr = parseFloat($(this).css("margin-right"));
            }
            return naNTest(brw) + naNTest(pr) + naNTest(mr);
        },

        topBorderWidth: function() {
            var blw = parseFloat($(this).css("borderTopWidth"));
            var pl = parseFloat($(this).css("padding-top"));
            var ml = 0;
            if ($(this).css("margin-top") != "auto") {
                ml = parseFloat($(this).css("margin-top"));
            }
            return naNTest(blw) + naNTest(pl) + naNTest(ml);
        },

        bottomBorderWidth: function() {
            var brw = parseFloat($(this).css("borderBottomWidth"));
            var pr = parseFloat($(this).css("padding-bottom"));
            var mr = 0;
            if ($(this).css("margin-bottom") != "auto") {
                mr = parseFloat($(this).css("margin-bottom"));
            }
            return naNTest(brw) + naNTest(pr) + naNTest(mr);
        },

        setOuterWidth: function(width) {
            var bw = $(this).leftBorderWidth() + $(this).rightBorderWidth();
            $(this).width(width - bw);
            return this;
        },

        setOuterHeight: function(height) {
            var bh = $(this).topBorderWidth() + $(this).bottomBorderWidth();
            $(this).height(height - bh);
            return this;
        },

        textselection: function () {
            /// <summary>jQuery plugins to get/set text selection for input element</summary>
            var start, end, t = this[0];
            var val = this.val();
            if (arguments.length === 0) {
                var range, stored_range, s, e;
                if ($.browser.msie && $.browser.version < 9) {
                    try {
                        var selection = document.selection;
                        if (t.tagName.toLowerCase() != "textarea") {
                            //$(this).focus();
                            range = selection.createRange().duplicate();
                            range.moveEnd("character", val.length);
                            s = (range.text === "" ? val.length : val.lastIndexOf(range.text));
                            range = selection.createRange().duplicate();
                            range.moveStart("character", -val.length);
                            e = range.text.length;
                        } else {
                            range = selection.createRange();
                            stored_range = range.duplicate();
                            stored_range.moveToElementText(t);
                            stored_range.setEndPoint('EndToEnd', range);
                            s = stored_range.text.length - range.text.length,
                        e = s + range.text.length
                        }
                    }
                    catch(e) {}//fixed bug 26153
                } else {
                    // invisible input throw an exception in FF
                    //if ($(t).isPrototypeOf(':visible')) {
                    s = t.selectionStart;
                    e = t.selectionEnd;
                    //}
                    //else {
                    //  s = e = 0;
                    //}
                }

                var te = val.substring(s, e);
                return { start: s, end: e, text: te, replace: function (st) {
                    return val.substring(0, s) + st + val.substring(e, val.length)
                }
                };
            } else if (arguments.length === 1) {
                if (typeof arguments[0] === "object" && typeof arguments[0].start === "number" && typeof arguments[0].end === "number") {
                    start = arguments[0].start;
                    end = arguments[0].end;
                } else if (typeof arguments[0] === "string") {
                    if ((start = val.indexOf(arguments[0])) > -1) {
                        end = start + arguments[0].length;
                    }
                } else if (Object.prototype.toString.call(arguments[0]) === "[object RegExp]") {
                    var re = arguments[0].exec(val);
                    if (re != null) {
                        start = re.index;
                        end = start + re[0].length;
                    }
                }
            } else if (arguments.length === 2) {
                if (typeof arguments[0] === "number" && typeof arguments[1] === "number") {
                    start = arguments[0];
                    end = arguments[1];
                }
            }

            if (typeof start === "undefined") {
                start = 0;
                end = val.length;
            }

            if ($.browser.msie) {
                var selRange = t.createTextRange();
                selRange.collapse(true);
                selRange.moveStart('character', start);
                selRange.moveEnd('character', end - start);
                selRange.select();
            } else {
                t.selectionStart = start;
                t.selectionEnd = end;
            }
        }
    });

    /******************************************************************************/
    /*********************************** EASING ***********************************/
    /******************************************************************************/

    (function() {

        // based on easing equations from Robert Penner (http://www.robertpenner.com/easing)

        var baseEasings = {};

        $.each(["Quad", "Cubic", "Quart", "Quint", "Expo"], function(i, name) {
            baseEasings[name] = function(p) {
                return Math.pow(p, i + 2);
            };
        });

        $.extend(baseEasings, {
            Sine: function(p) {
                return 1 - Math.cos(p * Math.PI / 2);
            },
            Circ: function(p) {
                return 1 - Math.sqrt(1 - p * p);
            },
            Elastic: function(p) {
                return p === 0 || p === 1 ? p :
                    -Math.pow(2, 8 * (p - 1)) * Math.sin(((p - 1) * 80 - 7.5) * Math.PI / 15);
            },
            Back: function(p) {
                return p * p * (3 * p - 2);
            },
            Bounce: function(p) {
                var pow2,
                    bounce = 4;

                while (p < ((pow2 = Math.pow(2, --bounce)) - 1) / 11) {}
                return 1 / Math.pow(4, 3 - bounce) - 7.5625 * Math.pow((pow2 * 3 - 2) / 22 - p, 2);
            }
        });

        $.each(baseEasings, function(name, easeIn) {
            $.easing["easeIn" + name] = easeIn;
            $.easing["easeOut" + name] = function(p) {
                return 1 - easeIn(1 - p);
            };
            $.easing["easeInOut" + name] = function(p) {
                return p < 0.5 ?
                    easeIn(p * 2) / 2 :
                    1 - easeIn(p * -2 + 2) / 2;
            };
        });

    })();
})(jQuery);
/*global jQuery, jQuery,document, HUI*/
/*
 * hui.mouse
 * Depends:
 *	hui.widget.core.js
 */

(function($) {
    "use strict";

    var INVALID_ELES = 'input,textarea,button,select,option',
        isMouseHandled = false;

    HUI.Widget.extend("Mouse", {
        options: {
            invalid: INVALID_ELES,
            distance: 1
        },

        _mouseProxy: function() {
            return this.element;
        },

        _mouseInit: function() {
            var self = this,
                wn = self.widgetName,
                el = self._mouseProxy();

            el.bind('mousedown.' + wn, function(event) {
                return self._mouseDown(event);
            }).bind('click.' + wn, function(event) {
                if (true === $.data(event.target, wn + '.preventClick')) {
                    $.removeData(event.target, wn + '.preventClick');
                    event.stopImmediatePropagation();
                    return false;
                }
            });

            self.started = false;
        },

        _mouseDown: function(event) {
            if (isMouseHandled)
                return;
            // we may have missed mouseup (out of window)
            (this._mouseStarted && this._mouseUp(event));

            this._mouseDownEvent = event;

            var self = this,
                cancel = this.options.invalid,
                btnIsLeft = (event.which === 1),
                elIsCancel = (typeof cancel === "string" && event.target.nodeName ?
                    $(event.target).closest(cancel).length :
                    false);

            if (!btnIsLeft || elIsCancel || !this._mouseCapture(event)) {
                return true;
            }

            if (this._mouseDistanceMet(event)) {
                this._mouseStarted = (this._mouseStart(event) !== false);
                if (!this._mouseStarted) {
                    event.preventDefault();
                    return true;
                }
            }

            if (true === $.data(event.target, this.widgetName + '.preventClick')) {
                $.removeData(event.target, this.widgetName + '.preventClick');
            }

            // these delegates are required to keep context(self)
            this._mouseMoveDelegate = function(event) {
                return self._mouseMove(event);
            };
            this._mouseUpDelegate = function(event) {
                return self._mouseUp(event);
            };
            $(document)
                .bind('mousemove.' + this.widgetName, this._mouseMoveDelegate)
                .bind('mouseup.' + this.widgetName, this._mouseUpDelegate);

            event.preventDefault();

            isMouseHandled = true;
            return true;
        },

        _mouseMove: function(event) {
            // IE mouseup check - mouseup happened when mouse was out of window
            if (/msie ([\w.]+)/.exec(navigator.userAgent.toLowerCase()) &&
                document.documentMode < 9 &&
                !event.button) {
                return this._mouseUp(event);
            }

            if (this._mouseStarted) {
                this._mouseDrag(event);
                return event.preventDefault();
            }

            if (this._mouseDistanceMet(event)) {
                this._mouseStarted =
                    (this._mouseStart(this._mouseDownEvent, event) !== false);
                (this._mouseStarted ? this._mouseDrag(event) : this._mouseUp(event));
            }

            return !this._mouseStarted;
        },

        _mouseUp: function(event) {
            this._unbindMoveUp();

            if (this._mouseStarted) {
                this._mouseStarted = false;

                if (event.target === this._mouseDownEvent.target) {
                    $.data(event.target, this.widgetName + '.preventClick', true);
                }

                this._mouseStop(event);
            }

            return false;
        },

        _mouseDistanceMet: function(event) {
            return (Math.max(
                Math.abs(this._mouseDownEvent.pageX - event.pageX),
                Math.abs(this._mouseDownEvent.pageY - event.pageY)
            ) >= this.options.distance);
        },

        _unbindMoveUp: function() {
            $(document).unbind('mousemove.' + this.widgetName, this._mouseMoveDelegate)
                .unbind('mouseup.' + this.widgetName, this._mouseUpDelegate);
        },

        _mouseDestroy: function() { //remove all mouse handler.
            this.element.unbind('.' + this.widgetName);
            this._mouseMoveDelegate && this._unbindMoveUp();
        },

        // These are placeholder methods, to be overriden by extending plugin
        _mouseStart: function(event) {}, //return false to cancel the mouse action
        _mouseDrag: function(event) {},
        _mouseStop: function(event) {},
        _mouseCapture: function(event) {
            //Occured before mousestart, it's used for check if mouse action is valid according to event
            return true;
        }
    });

    $(document).mouseup(function(e) {
        isMouseHandled = false;
    });

})(jQuery);
/*global jQuery, window, HUI*/

/**
 * @namespace HUI.Accordion
 */
(function ($) {
    'use strict';

    HUI.Widget.extend('Accordion', {

        options: {
            /**
             * @name header
             * @desc 设置自定义头部class
             * @type string
             * @default null
             */
            header: null,
            /**
             * @name duration
             * @desc 执行动画耗费的事件
             * @type string
             * @default null
             */
            duration: 200,
            /**
             * @name isCloseOthers
             * @desc 在一项展开时是否关闭其他项
             * @type bool
             * @default true
             */
            isCloseOthers: true,
            /**
             * 当前项折叠时触发
             * @event collapse
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
            collapse: null,
            /**
             * 当前项展开时触发
             * @event expand
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
            expand: null
        },

        _create: function () {

            this.element.addClass('hui-accordion');

            this._processPanels();
            this._bindEvents();
        },

        _bindEvents: function () {
            var self = this,
                eventName = 'click';

            this.element.on(eventName, this.options.header, function () {
                var $this = $(this);

                if (!self.options.isCloseOthers) {

                    $this.toggleClass('on');
                    self._showPanel($this);

                }
                else if (!$this.hasClass('on')) {

                    self._showPanel($('.on'));
                    $('.on').removeClass('on');

                    $this.addClass('on');
                    self._showPanel($this);
                }
            });
        },

        _showPanel: function ($curObj) {
            var self = this,
                duration = self.options.duration,
                trigger = function (obj) {
                    if (obj.style.display === 'none') {
                        self._trigger('collapse', null, this);
                    }
                    else {
                        self._trigger('expand', null, this);
                    }
                };

            if (duration === false) {
                duration = 0;
            }
            $curObj.next().slideToggle(duration, function () {
                trigger(this);
            });
        },

        _processPanels: function () {
            var $headers;
            if (this.options.header) {
                $headers = this.element.find(this.options.header);
                $headers.addClass('hui-accordion-title');
            }
            else {
                var $cont = this.element.find('[title]');
                if ($cont.length > 0) {
                    $cont.each(function () {
                        $(this).prev().addClass('hui-accordion-title');
                    });
                }
            }

            this.options.header = '.hui-accordion-title';
            $headers = this.element.find(this.options.header);

            $headers.next().hide();
            $headers.eq(0).addClass('on').next().show();
        }
    });

})(window.jQuery);
/*global jQuery, window, HUI*/

(function($) {
	"use strict";

	/**
	* This widget makes a carousel function
	* @require HUI.widget.core
	* @example
	* $('div').huiCarousel({
	*	auto: false
	* })
	*/	
	HUI.Widget.extend("Carousel", {
		options: {
			/**
			 * @name animation
			 * 设置Carousel的轮播动画
			 * @type {Object}
			 */
			animation: {
				/**
				 * @name duration
				 * @type number
				 * @default 400
				 * @desc 设置动画的间隔时间
				 */
				duration: 400,
				/**
				 * @name interval
				 * @type {Number}
				 * @default 5000
				 * @desc 设置每两次动画开始之间的停留时间
				 */
				interval: 5000
					//easing: 'linear'
			},
			/**
			 * @name auto
			 * @type boolean
			 * @default true
			 * @desc 设置是否自动切换
			 */
			auto: true,
			/**
			 * @name stopOnHover
			 * @type boolean
			 * @default true
			 * @desc 自动滚动的时候，鼠标进入(hover)，停止滚动
			 */
			stopOnHover: true,
			/**
			 * @name step
			 * @type number
			 * @default 1
			 * @desc 设置每次滚动的图片数量
			 */
			step: 1,
			/**
			 * @name display
			 * @type number
			 * @default 1
			 * @desc 可展示图片数量
			 */
			display: 1,
			/**
			 * @name showPager
			 * @type boolean
			 * @default true
			 * @desc 是否显示页码
			 */
			showPager: true,
			/**
			 * @name showButtons
			 * @type bool
			 * @default true
			 * @desc 是否显示按钮
			 */
			showButtons: true,
			/**
			 * @name showButtonsOnHover
			 * @type bool
			 * @default true
			 * @desc 决定是在Hover时显示Button，还是一直显示Button
			 */
			showButtonsOnHover: false,
			/**
			 * @name offset
			 * @type array
			 * @default null
			 * @desc 是否按钮位置的偏移量, 以[x,y]的形式给出
			 */
			offset: null,
			/**
			 * @name prevHTML
			 * @type string
			 * @default  '<a href="javascript:void(0);" class="hui-carousel-prev-btn"></a>'
			 * @desc 向左切换按钮的HTML代码
			 */
			prevHTML: '<a href="javascript:void(0);" class="hui-carousel-prev-btn"></a>',
			/**
			 * @name nextHTML
			 * @type string
			 * @default '<a href="javascript:void(0);" class="hui-carousel-next-btn"></a>'
			 * @desc 向右切换按钮的HTML代码
			 */
			nextHTML: '<a href="javascript:void(0);" class="hui-carousel-next-btn"></a>',
			/**
			 * @name pager
			 * @type string
			 * @default 'dotted'
			 * @desc 页码样式，对应的页码样式类名, 有'slide'和'dotted'两种
			 */
			pager: 'dotted',
			/**
             * 当轮播图滚动前触发。
             * @event beforeScroll
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
			beforeScroll: null,
			/**
             * 当轮播图滚动后触发。
             * @event afterScroll
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
			afterScroll: null
		},

		_create: function() {
			var o = this.options, el = this.element;

			el.addClass('hui-carousel');
			this._initStatus();
			this.clip = this.list.wrap("<div></div>")
			.parent()
			.addClass('hui-carousel-clip');

			if (o.showButtons) {
				this.prevBtn = $(o.prevHTML).appendTo(el);
				this.nextBtn = $(o.nextHTML).appendTo(el);
			}
			if (o.showPager && o.display === 1) {
				this._createPager();
			}

			this._applyStyles();
			this._bindEvent();

			if (o.auto) this._play();
		},

		_initStatus: function() {
			var item;
			this.list = this.element.children('ul').addClass('hui-carousel-list');
			this.items = this.list.find('>li').addClass('hui-carousel-item hui-clearfix');
			this.totalCount = this.items.length;
			item = this.items.eq(0);
			this.itemWidth = this.element.width() / this.options.display;
			this.itemHeight = this.element.height();
			this.itemIndex = this.marginLeft = 0;
		},

		_applyStyles: function(){
			var o = this.options,
				getOffset = function(idx, reverse) {
					if(!o.offset) return '';

					var value = o.offset[idx], offset;
					if(!value) return '';
					offset = parseInt(value, 10);

					return ((offset < 0 ^ reverse) ? '-' : '+') + Math.abs(offset);
				};

			this.clip.width(this.itemWidth * this.options.display).height(this.itemHeight);
			this.items.setOuterWidth(this.itemWidth).setOuterHeight(this.itemHeight);
			this.list.width(this.itemWidth * this.totalCount).height(this.itemHeight);
			
			
			if (this.options.showButtons) {
				this.prevBtn.position({
					collision: "none",
					of: this.element,
					my: 'left' + getOffset(0, false) +' center' + getOffset(1, false),
					at: 'left center'
				});
				this.nextBtn.position({
					collision: "none",
					of: this.element,
					my: 'right' + getOffset(0, true) +' center' + getOffset(1, false),
					at: 'right center'
				});;
			}
		},

		_createPager: function() {
			var self = this, 
				pageHtml, 
				o = self.options, 
				css = o.pager === 'dotted' ? 'hui-carousel-dotted' : 'hui-carousel-slide',
				$pages, width;
				
			pageHtml = '<ul class="' + css + '">';
			for (var i = 0; i < self.totalCount; i++) {
				pageHtml += '<li ' + (i === 0 ? 'class="hui-carousel-current"' : '') + '></li>';
			}
			pageHtml += '</ul>';

			$pages = $(pageHtml).appendTo(self.element);
			width = self.totalCount * $pages.find('>li').eq(0).outerWidth(true);
			$pages.css({
				width: width,
				left: (self.itemWidth - width) * 0.5
			});
			
			self.page = {
				$pages: $pages,
				$pageList: $pages.find('>li'),
				index: 0
			};

			for (i = 0; i < self.totalCount; i++) {
				self.items.eq(i).addClass('li_' + i);
			}

			self.page.$pages.delegate('li', 'click', function() {
				if (self.animating) {
					return false;
				}
				var $this = $(this);
				if ($this.hasClass('hui-carousel-current')) {
					return false;
				}
				self.animating = true;
				self._resetList();

				self.itemIndex = self.page.index = $this.index();
				self.marginLeft = self.itemIndex * self.itemWidth;
				self._srcollTo(0);
			});
		},

		_resetList: function() {
			var index = this.list.find('>.li_0').index();

			if (!index) return false;

			this.list.find('>li:lt(' + index + ')').appendTo(this.list);
			var p_index = this.page.$pages.find('>.hui-carousel-current').index();
			this.list.css('margin-left', -p_index * this.itemWidth);
		},

		/**
		 * 播放后一张图片
		 * @returns {jQuery} 当前Carousel元素
		 */
		next: function() {
			var self = this;
			if (this.animating) {
				return false;
			}

			this.animating = true;
			this.itemIndex += self.options.step;

			if (this.itemIndex + this.options.display > this.totalCount) {
				var count = -(self.totalCount - this.itemIndex - self.options.display);
				this.list.find('>li:lt(' + count + ')').appendTo(this.list);
				this.list.css('margin-left', '+=' + count * this.itemWidth);
				this.itemIndex -= count;
			}

			this.marginLeft = this.itemIndex * this.itemWidth;
			this._srcollTo(1);
		},

		/**
		 * 播放前一张图片
		 * @returns {jQuery} 当前Carousel元素
		 */
		prev: function() {
			var self = this;
			if (this.animating) {
				return false;
			}
			this.animating = true;
			this.itemIndex -= self.options.step;
			if (this.itemIndex < 0) {
				var count = -this.itemIndex;
				this.list.find('>li:gt(' + (this.totalCount - count - 1) + ')').prependTo(this.list);
				this.list.css('margin-left', '-=' + count * this.itemWidth);
				this.itemIndex += count;
			}

			this.marginLeft = this.itemIndex * this.itemWidth;
			this._srcollTo(-1);
		},

		_srcollTo: function(increment) {

			var self = this, page = this.page;

			if(!page || self._trigger('beforeScroll', this) === false) return false;

			self.list.animate({
				'margin-left': -(self.marginLeft) + 'px'
			}, self.options.animation.duration, function() {
				self._trigger('afterScroll', self);
				self.animating = false;
			});
			
			page.index = page.index + increment;
			if (increment === 1 && page.index >= this.totalCount) {
				page.index = 0;
			}
			if (increment === -1 && page.index < 0) {
				page.index = this.totalCount - 1;
			}

			page.$pageList.eq(page.index)
				.addClass('hui-carousel-current')
				.siblings()
				.removeClass('hui-carousel-current');
		},

		play: function(){
			return this._play();
		},

		pause: function() {
			return this._clearTimer();
		},

		_clearTimer: function() {
			if (this.playTimer) {
				clearInterval(this.playTimer);
				this.playTimer = null;
			}
		},

		_play: function(){
			var self = this;	

			this._clearTimer();
			self.playTimer = setInterval(function() {
				self.next();
			}, self.options.animation.interval);
		},

		_bindEvent: function() {
			var self = this;

			if(this.options.showButtons) {
				this.nextBtn.bind('click' + this.ns, $.proxy(this.next, this));
				this.prevBtn.bind('click' + this.ns, $.proxy(this.prev, this));

				if(this.options.showButtonsOnHover) {
					var btns = this.nextBtn.add(this.prevBtn);
					btns.hide();
					this.element.bind({
						'mouseenter': function() {
							btns.show();
						},
						'mouseleave': function() {
							btns.hide();
						}
					});
				}
			}

			if (!this.options.stopOnHover) return;

			this.element.bind({
				'mouseenter': function() {
					self._clearTimer();
				},
				'mouseleave': function() {
					self._play();
				}
			});
		}
	});

	// HUI.widgets.Carousel.pager = {
	// 	_create: function(){},
	// 	_bindEvent: function(){},
	// 	_destory: function(){}
	// }

})(jQuery);
/*global jQuery, HUI*/

(function ($) {
    'use strict';

    if (HUI.isIE) { //hack ie浏览器刷新页面input只保留ui中check状态,js获取不了check值
        window.onbeforeunload = function () {
            var inputsLength = HUI.widgets.Checkbox.inputs.length;

            if (inputsLength) {
                for (var i = 0; i < inputsLength; i++) {
                    HUI.widgets.Checkbox.inputs[i].get(0).checked = false;
                }
            }
        };
    }

    HUI.Widget.extend('Checkbox', {

        options: {
            /**
             * @name checked
             * @type string
             * @default 'checked'
             * @desc 设置checkbox元素选中后状态
             */
            checked: 'checked',
            /**
             * @name margin
             * @type sting
             * @default ''
             * @desc 设置checkbox元素margin,当margin为null时直接继承input元素margin
             */
            margin: ''
        },

        _create: function () {

            if (typeof HUI.widgets.Checkbox.inputs === 'undefined') {
                HUI.widgets.Checkbox.inputs = {};
            }

            var me = this,
                $item = this.element,
                type = $item.attr('type');

            if ((type !== 'checkbox' && type !== 'radio') || $item.hasClass('hui-checkbox')) {
                return;
            }

            var icon = '<span class="hui-' + type + ' ' + ($item.get(0).checked ? me.options.checked : '') + '" style="margin:' +
                (me.options.margin ? me.options.margin : ($item.css('margin-top') + ' ' + $item.css('margin-left') + ' ' + $item.css('margin-bottom') + ' ' + $item.css('margin-right'))) +
                '; vertical-align:bottom;"></span>',
                $icon, inputId = $item.attr('id');

            if (!inputId) {
                inputId = 'checkbox' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                $item.attr('id', inputId);
            }

            $item.addClass('hui-checkbox').css({ //hide()在 ie78中点击图标会无法选中选项
                'position': 'absolute',
                'top': -9999,
                'left': -9999
            });

            if (!$item.parent('label').length) {
                $item.after('<label for="' + $item.attr('id') + '">' + icon + '</label>');
                $icon = $item.next().children('span');
            }
            else {
                $item.after(icon);
                $icon = $item.next();
            }

            $item.on('change', function () {
                switch (type) {
                case 'checkbox':
                    me._checkboxEvent($item, $icon);
                    break;
                case 'radio':
                    me._radioEvent($item, $icon);
                    break;
                }
            });

            HUI.widgets.Checkbox.inputs[inputId] = $item;
        },

        _checkboxEvent: function ($item, $icon) {
            var status = this.options.checked;

            if ($item.get(0).checked) {
                $icon.addClass(status);
            }
            else {
                $icon.removeClass(status);
            }
        },

        _radioEvent: function ($item, $icon) {
            if (typeof HUI.widgets.Checkbox.radios === 'undefined') {
                HUI.widgets.Checkbox.radios = {};
            }

            var status = this.options.checked,
                radiosObj = HUI.widgets.Checkbox.radios,
                $radioInput = radiosObj[$item.attr('name')];

            if ($radioInput) {
                if ($radioInput.parent('label').length) {
                    $radioInput.next().removeClass(status);
                }
                else {
                    $radioInput.next().children('span').removeClass(status);
                }
            }

            radiosObj[$item.attr('name')] = $item;
            $icon.addClass(status);
        }

    });
})(jQuery);
/*global jQuery, window, HUI*/

(function($) {
    "use strict";

    HUI.Widget.extend("Datepicker", {
        options: {
            /**
             * @name now
             * @desc 定义了当前时间，可以又服务器端传入，默认使用客户端当前时间
             * @type date
             * @default null
             */
            now: null,
            /**
             * @name region
             * @desc 定义语言版本，默认为中文，同时还支持英文等，用户可以通过HUI.widgets.evcal.prototype.regional访问多语言集
             * @type string
             * @default 'default'
             */
            region: 'default',
            /**
             * @name monthFormat
             * @desc 定义日历标题部分月份显示的格式
             * @type string
             * @default '{year}年{month}月'
             */
            monthFormat: '{year}年{month}月',
            /**
             * @name itemTemplate
             * @desc 定义了calendar每日视图的模板，可以是一段包含HTML的字串，也可以使一个function
             * @type string|function
             * @default null
             */
            itemTemplate: null,
            /**
             * @name minDate
             * 可选日期范围,代表距离今天之前的天数
             * @type date
             * @default null
             */
            minDate: null,
            /**
             * @name maxDate
             * 可选日期范围,代表距离今天之后的天数
             * @type date
             * @default null
             */
            maxDate: null,
            /**
             * @name mode
             * 生成窗口的模式，popup：弹窗， standalone 独立
             * @type string
             * @default 'popup'
             */ 
            mode: 'popup',
            /**
             * 当鼠标悬停到某一日时触发。
             * @event hover
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
            hover: null,
            /**
             * 当鼠标点击某一日时触发。
             * @event click
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
            click: null,
            /**
             * 当点击下一月时触发。
             * @event prevClick
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */    
            prevClick: null,
            /**
             * 当点击上一月时触发。
             * @event nextClick
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */ 
            nextClick: null
        },

        regional: {
            "default": {
                datNames: ['日', '一', '二', '三', '四', '五', '六']
            },
            "en": {
                datNames: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
            }
        },

        _create: function() {
            this.status = {};
            this._renderHTML();
            this._bindEvents();
        },

        /**
        在datepicker绘制结束后进行一些装饰
        @param {function} callback 对单日的HTML结构进行自定义
        @returns {jQuery} 
        */
        decorateCal: function(callback) {
            var s = this.status;
            this.$cal.find('.hui-cal-column').each(function() {
                var $item = $(this),
                    year = $item.attr("data-year"),
                    month = $item.attr("data-month"),
                    date = $(this).attr("data-date");
                callback.call(this, $item, new Date(year, month, date));
            });
        },

        _renderHTML: function() {
            var today,
                year,
                month,
                $content = $('<div class="hui-cal-content"></div>'),
                $calTable = $('<table class="hui-cal-table"></table>'),
                $wrapper = $('<div class="hui-cal-wrapper"></div>'),
                o = this.options;

            today = this._getDate(this.options.now) || new Date();
            this.today = today = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate());

            this.status.curYear = year = today.getFullYear();
            this.status.curMonth = month = today.getMonth();            
            this.element.addClass("hui-datepicker");

            if(o.mode == 'popup'){
                this.$dateWrapper = $wrapper.appendTo('body').hide();
                this._setPosition();
            }
            else{
                if(this.element.is('input')){
                    console.error('standalone mode not suport for input element');
                }
                else{
                    this.$dateWrapper = $wrapper.appendTo(this.element);
                }
            }
            this.$header = this._renderHeader().appendTo($wrapper);
            $content.appendTo($wrapper);
            this.$week = this._renderWeek().appendTo($calTable);
            this.$cal = $('<tbody>').html(this._renderCal(year, month))
                .appendTo($calTable);

            $calTable.appendTo($content);
        },

        _setPosition: function () {
            var thisElem = this.element;

            this.$dateWrapper.css({
                top: thisElem.offset().top + thisElem.outerHeight(),
                left: thisElem.offset().left
            });
        },

        _renderHeader: function() {
            var $header = $('<div class="hui-cal-header"></div>');

            this.$monthTitle = $('<span class="hui-text"></span>').appendTo($header);
            this.$next = $('<a class="hui-cal-next-btn">〉</a>').appendTo($header);
            this.$prev = $('<a class="hui-cal-prev-btn">〈</a>').appendTo($header);
            this._refreshMonthTitle();

            return $header;
        },

        _refreshMonthTitle: function() {
            var month = this.options.monthFormat
                .replace(/\{year\}/, this.status.curYear)
                .replace(/\{month\}/, this.status.curMonth + 1);

            this.$monthTitle.html(month);
        },

        _renderCal: function(year, month) {
            var self = this,
                o = self.options,
                curDate, startDate, numRows,
                calHtml = '',
                firstDay,
                viewStart, viewEnd,
                colStyle = "hui-cal-column";

            firstDay = self._getFirstDayOfMonth(year, month);
            numRows = Math.ceil((self._getDaysInMonth(year, month) + firstDay) / 7);
            numRows > 4 && (colStyle += " hui-cal-column-five");
            var printDate = self._daylightSavingAdjust(new Date(year, month, 1 - firstDay));
            viewStart = printDate.getFullYear() + ',' + printDate.getMonth() + ',' + printDate.getDate();

            for (var dRow = 0; dRow < numRows; dRow++) {
                calHtml += '<tr class="hui-cal-row">';
                for (var dow = 0; dow < 7; dow++) {
                    var otherMonth = (printDate.getMonth() !== month),
                        isToday = printDate.getTime() === self.today.getTime(),
                        isInRange = true;

                    //根据option的时间范围设置日期可选状态
                    if(o.minDate != null){
                        var printMinDate = new Date(self.today.getFullYear(),self.today.getMonth(),self.today.getDate() + o.minDate);

                        if(printDate < printMinDate){
                            isInRange = false;
                        }
                    }
                    if(o.maxDate != null){
                        var printMaxDate = new Date(self.today.getFullYear(),self.today.getMonth(),self.today.getDate() + o.maxDate);

                        if(printDate > printMaxDate){
                            isInRange = false;
                        }
                    }

                    calHtml += '<td class="' + colStyle +
                        (otherMonth ? ' hui-cal-other-month' : '') +
                        (isToday ? ' hui-cal-today' : '') +
                        (isInRange ? '' : ' hui-cal-disabled') + '"';

                    calHtml += ' data-year="' + printDate.getFullYear() +
                        '" data-month="' + (printDate.getMonth() + 1 < 10 ? '0' + (printDate.getMonth() + 1) : printDate.getMonth() + 1) +
                        '" data-date="' + (printDate.getDate() < 10 ? '0' + printDate.getDate() : printDate.getDate()) + '">';

                    if (o.itemTemplate) {
                        if (typeof o.itemTemplate === 'function') {
                            var customItem = o.itemTemplate.call(self, printDate);
                            typeof customItem === 'string' && (calHtml += customItem);
                        } else if (typeof o.itemTemplate === 'string') {
                            calHtml += o.itemTemplate.replace(/\{date\}/g, printDate.getDate());
                        }
                    } else {
                        calHtml += '<span class="hui-cal-date">' + printDate.getDate() + '</span>';
                    }

                    calHtml += '</td>';

                    printDate.setDate(printDate.getDate() + 1);
                    printDate = this._daylightSavingAdjust(printDate);
                }

                calHtml += '</tr>';
            }

            viewEnd = printDate.getFullYear() + ',' + printDate.getMonth() + ',' + printDate.getDate();

            self.element.data({
                viewStart: viewStart,
                viewEnd: viewEnd
            });

            return calHtml;
        },

        _renderWeek: function() {
            var weekHtml = '<thead class="hui-cal-week"><tr class="hui-cal-weekday">',
                days = this.regional[this.options.region].datNames;

            for (var dow = 0; dow < 7; dow++) {
                weekHtml += '' +
                    '<th title="' + days[dow] + '">' + days[dow] + '</th>';
            }
            weekHtml += '</tr></thead>';

            return $(weekHtml);
        },

        _parseDate: function () {
            var self = this,
                elemVal = self.element.val();

            if(elemVal != undefined && elemVal != ''){
                var y,m,d,
                    dateSplited = elemVal.split('-');

                y = parseInt(dateSplited[0]);
                m = parseInt(dateSplited[1]) - 1;
                d = parseInt(dateSplited[2]);

                self._highlightSelected(y, m, d);
                return [y, m, d];
            }
        },

        //已选日期高亮
        _highlightSelected: function (year, month, date) {
            var calColumn = this.$dateWrapper.find('.hui-cal-column');
            calColumn.each(function() {
                var $this = $(this),
                    $thisY = parseInt($this.attr('data-year')),
                    $thisM = parseInt($this.attr('data-month')) - 1,
                    $thisD = parseInt($this.attr('data-date'));

                if($thisY == year && $thisM == month && $thisD == date){
                    $this.addClass('hui-date-selected').siblings('.hui-cal-column').removeClass('hui-date-selected');
                }
            });
        },

        _renderSelectedDate: function () {
            var self = this,
                elemVal = self.element.val(),
                parseResult = self._parseDate();

            if(elemVal != undefined && elemVal != ''){
                self.$cal.html(self._renderCal(parseResult[0], parseResult[1]));
                self._highlightSelected(parseResult[0], parseResult[1], parseResult[2]);

                //改变标题
                self.status.curYear = parseResult[0];
                self.status.curMonth = parseResult[1];
                self._refreshMonthTitle();
            }
        },

        _adjustMonth: function(offset) {
            var self = this, date;

            self.status.curMonth += offset;
            date = new Date(self.status.curYear, self.status.curMonth, 1);
            self.status.curYear = date.getFullYear();
            self.status.curMonth = date.getMonth();

            self.$cal.empty();
            self.$cal.html(self._renderCal(self.status.curYear, self.status.curMonth));
            self._refreshMonthTitle();

            self._parseDate();
        },

        _bindEvents: function() {
            var self = this,
                o = self.options,
                thisElem = self.element,
                param = [];

            //绑定点击事件，获得点击的日期
            self.$cal.on('click','.hui-cal-column', function () {
                var $thisColumn = $(this);
                if($thisColumn.hasClass('hui-cal-disabled')){
                    return;
                }
                if(o.mode == 'popup'){
                    self.element.val($thisColumn.attr('data-year') + '-' + $thisColumn.attr('data-month') + '-' + $thisColumn.attr('data-date'));
                    self.$dateWrapper.hide();
                }
                else{
                    $thisColumn.closest('.hui-cal-table').find('.hui-cal-column').removeClass('hui-date-selected');
                    $thisColumn.addClass('hui-date-selected');
                    return $thisColumn.attr('data-year') + '-' + $thisColumn.attr('data-month') + '-' + $thisColumn.attr('data-date');
                }
            });

            //鼠标悬停
            self.$cal.on('mouseenter','.hui-cal-column', function () {
                if(!$(this).hasClass('hui-cal-disabled')){
                    $(this).addClass('cal_column_hover');
                }
            });
            self.$cal.on('mouseleave','.hui-cal-column', function () {
                $(this).removeClass('cal_column_hover');
            });

            //切换月份
            self.$prev.bind('click', function() {
                self._adjustMonth(-1);
                self._trigger("prevClick", null, {
                    year: self.status.curYear,
                    month: self.status.curMonth
                });
            });

            self.$next.bind('click', function() {
                self._adjustMonth(1);
                self._trigger("nextClick", null, {
                    year: self.status.curYear,
                    month: self.status.curMonth
                })
            });

            if(o.mode == 'popup'){
                //resize
                $(window).on('resize', function () {
                    self._setPosition();
                });

                thisElem.on('click', function (e) {
                    e.stopPropagation();
                    //点击时解析输入框内的值并将日历跳转到相应月份和日期
                    var $this = $(this);

                    self._renderSelectedDate();
                    self._show();

                    // $(document).off('click');
                    $(document).on('click', $.proxy(self._hide, self));
                });
            }

            //自定义事件
            self.$cal.delegate(".hui-cal-column", {
                "hover": function(event) {
                    self._trigger("hover", this);
                },
                "click": function(event) {
                    if(!$(this).hasClass('hui-cal-disabled')){
                        param = {};
                        param.selectDate = new Date($(this).attr('data-year'), $(this).attr('data-month') - 1, $(this).attr('data-date'));
                        self._trigger("click", this, param);
                    }
                }
            });
        },

        _show: function () {
            var self = this;

            self.$dateWrapper.show();
        },

        _hide: function (e) {
            var self = this;

            if(!$(e.target).closest('.hui-cal-wrapper').length){
                self.$dateWrapper.hide();
            }
        },

        _getDate: function(date) {
            return date && new Date(date);
        },

        /* Find the number of days in a given month. */
        _getDaysInMonth: function(year, month) {
            return 32 - this._daylightSavingAdjust(new Date(year, month, 32)).getDate();
        },

        /* Find the day of the week of the first of a month. */
        _getFirstDayOfMonth: function(year, month) {
            return new Date(year, month, 1).getDay();
        },

        /* Handle switch to/from daylight saving.*/
        _daylightSavingAdjust: function(date) {
            if (!date) return null;
            date.setHours(date.getHours() > 12 ? date.getHours() + 2 : 0); //verify this method
            return date;
        }
    });

})(jQuery);
/*global jQuery, window, HUI*/

/**
 * @namespace HUI.Dialog
 */
(function($) {
    "use strict";
    HUI.define(["hui.widget.core", "hui.draggable", "hui.resizable"], function() {

        HUI.Widget.extend("Dialog", {
            options: {
                 /**
                 * @name openOnload
                 * @desc 是否在页面加载时显示对话框
                 * @type bool
                 * @default true
                 */
                openOnload: true,
                /**
                 * @name closeOnEsc
                 * @desc 是否在ESC键时关闭Dialog
                 * @type bool
                 * @default true
                 */
                closeOnEsc: true,
                /**
                 * @name showHeader
                 * @desc 是否显示Dialog的头部，头部信息可以从dialag内容的title属性获得
                 * @type bool
                 * @default true
                 */
                showHeader: true,
                /**
                 * @name showClose
                 * @desc 是否显示Dialog的关闭按钮
                 * @type bool
                 * @default true
                 */
                showClose: true,
                /**
                 * @name width
                 * @desc 设置dialog的宽度
                 * @type number
                 * @default 500
                 */
                width: 500,
                /**
                 * @name height
                 * @desc 设置dialog的宽度, 可以指定为"auto"或是具体的数值
                 * @type number|string
                 * @default "auto"
                 */
                height: "auto",
                /**
                 * @name modal
                 * @desc 用来表示dialog是否为模态框对话框模式
                 * @type bool
                 * @default false
                 */
                modal: false,
                /**
                 * @name maxHeight
                 * @desc 用来限制dialog的最大高度(如果不设限制则设为false)
                 * @type number
                 * @default false
                 */
                maxHeight: false,
                /**
                 * @name maxWidth
                 * @desc 用来限制dialog的最大宽度(如果不设限制则设为false)
                 * @type number
                 * @default false
                 */
                maxWidth: false,
                /**
                 * @name minHeight
                 * @desc 用来限制dialog的最小高度
                 * @type number
                 * @default 150
                 */
                minHeight: 150,
                /**
                 * @name minHeight
                 * @desc 用来限制dialog的最小宽度
                 * @type number
                 * @default 150
                 */
                minWidth: 150,
                /**
                 * @name draggable
                 * @desc 用来设置dialog是否可以拖拽,需要依赖HUI.draggable
                 * @type bool
                 * @default false
                 */
                draggable: false,
                /**
                 * @name resizable
                 * @desc 用来设置dialog是否可以缩放(resize),需要依赖HUI.resziable
                 * @type bool
                 * @default false
                 */
                resizable: false,
                /**
                 * @name zIndex
                 * @desc 设置dialog的zIndex
                 * @type number
                 * @default 1000
                 */
                zIndex: 1000,
                /**
                 * @name animation
                 * @desc 设置dialog打开时的动画效果
                 * @type bool
                 * @default false
                 */
                animation: false,
                /**
                 * @name headerHTML
                 * @desc 定义了dialog头部标签模板，其中{title}表示头部文本内容
                 * @type string
                 * @default '<div class="hui-dialog-header">{title}</div>'
                 */
                headerHTML: '<div class="hui-dialog-header">{title}</div>',
                /**
                 * 在对话框关闭前触发。
                 * 可以通过return false取消默认打开的行为。
                 * @event beforeClose
                 * @param {jQuery.Event} e
                 * @param {jQuery} data
                 */
                beforeClose: null,
                /**
                 * 当对话框打开后触发。
                 * @event open
                 * @param {jQuery.Event} e
                 * @param {jQuery} data
                 */
                open: null,
                /**
                 * 当对话框关闭后触发。
                 * @event close
                 * @param {jQuery.Event} e
                 * @param {jQuery} data
                 */
                close: null
            },

            _create: function() {
                var self = this,
                    o = self.options,
                    $dialog;

                this.widget = $dialog = $("<div>").addClass("hui-dialog")
                    .css({
                        display: "none",
                        zIndex: o.zIndex
                    })
                    .attr("tabIndex", -1)
                    .width(o.width || 500)
                    .bind({
                        "mousedown": function(event) {
                            self._adjustLayer();
                            //self.widget.focus();
                        },
                        "keydown": function(event) {
                            if (o.closeOnEsc && event.keyCode === HUI.keyCode.ESC) {
                                self.close();
                                event.preventDefault();
                            }
                        }
                    })
                    .appendTo("body");

                this.element
                    .addClass("hui-dialog-content")
                    .show()
                    .appendTo($dialog);

                this._createTitle();
                this._initBehavior();

            },

            _createTitle: function() {
                var self = this,
                    title,
                    o = self.options,
                    widget = this.widget,
                    header;

                if (o.showHeader) {
                    title = this.element.attr("title") || o.title;
                    header = o.headerHTML.replace(/\{title\}/i, title);
                    this.header = $(header)
                        .bind("mousedown", function() {
                            widget.focus();
                        })
                        .prependTo(widget);
                    widget = this.header;
                }

                if (o.showClose)
                    this.$closeBtn = $('<div class="hui-dialog-close">')
                    .click(function() {
                        self.close();
                    }).appendTo(widget);

            },

            _adjustLayer: function() {
                var o = this.options,
                    d = HUI.widgets.Dialog;

                if (o.zIndex > d.maxZ) {
                    d.maxZ = o.zIndex;
                }

                if (this.overlay) {
                    d.maxZ += 1;
                    d.maxZ_overlay = d.maxZ;
                    this.overlay.css("z-index", d.maxZ_overlay);
                }

                d.maxZ += 1;
                this.widget.css("z-index", d.maxZ);
            },

            _initBehavior: function() {
                var o = this.options,
                    $dialog = this.widget;

                if (o.resizable) {
                    $dialog.huiResize({
                        alsoResize: this.element,
                        maxWidth: o.maxWidth,
                        maxHeight: o.maxHeight,
                        minWidth: o.minWidth,
                        minHeight: o.minHeight,
                        handles: 'e,se,s'
                    });
                }

                if (o.draggable) {
                    $dialog.huiDrag({
                        handle: '.hui-dialog-header',
                        containment: "window"
                    });
                }
            },

            _init: function() {
                if (this.options.openOnload) {
                    this.open();
                }
            },

            _createOverlay: function() {
                var self = this,
                    getDocSize = function() {
                        return {
                            //width: HUI.$doc.width() + 'px',
                            height: HUI.$doc.height() + 'px'
                        };
                    };

                $(window).bind("resize.dialog", function() {
                    self.overlay.css({
                        //width: 0,
                        height: 0
                    }).css(getDocSize());

                    self._setPosition();
                });

                return $("<div class='hui-overlay'>").appendTo(document.body).css(getDocSize());
            },

            _setPosition: function() {
                var self = this,
                    o = self.options,
                    d = this.widget,
                    winW = HUI.$win.width(),
                    winH = HUI.$win.height(),
                    top, left,
                    scrollTop = d.css('position') !== 'fixed' ? HUI.$win.scrollTop() : 0;

                top = winH / 2 - d.outerHeight(true) / 2 + scrollTop;
                left = winW / 2 - d.outerWidth(true) / 2;

                d.css({
                    left: left,
                    top: top
                });
            },

            /**
			打开对话框.
			@param {number} - duration
			@returns {jQuery} 
			*/
            open: function() {
                if (this.isOpen) return;

                var self = this,
                    o = this.options;

                this.overlay = o.modal ? this._createOverlay() : null;
                this._setPosition();
                this._adjustLayer();

                if (typeof o.animation === 'number') {
                    this.widget.fadeIn(o.animation, function() {
                        self.widget.focus();
                        self.isOpen = true;
                        self._trigger("open", null, null);
                    });
                } else {
                    this.widget.show();
                    self.widget.focus();
                    this.isOpen = true;
                    this._trigger("open", null, null);
                }

                return this;
            },

            /**
			关闭对话框.
			@param {number} - duration
			@returns {jQuery} 
			*/
            close: function() {
                if (!this.isOpen) return;

                if (this._trigger("beforeClose", null) === false) {
                    return;
                }
                this.isOpen = false;

                if (this.overlay) {
                    this.overlay.remove();
                }

                this.widget.hide();
                this._trigger("close", null, null);
                return this;
            }
        });

        HUI.widgets.Dialog.maxZ = 0;

    });

})(jQuery);
/*global jQuery, HUI*/
/*
 * hui.draggable
 * Depends:
 *  hui.mouse.js
 */

(function($) {
    "use strict";
    var Mouse = HUI.widgets.Mouse;
    Mouse.extend("Drag", {
        options: {
            /**
             * @name appendTo
             * @type string
             * @default 'parent'
             * @desc 设置进度条的宽度
             */
            appendTo: "parent",
            /**
             * @name axis
             * @desc 设置拖拽元素的方向轴，false为任意，'x'表示水平方向,'y'表示垂直方向
             * @type number
             * @default false
             */
            axis: false,
            /**
             * @name cursor
             * @desc 设置拖拽时的鼠标手型
             * @type string
             * @default 'auto'
             */
            cursor: "auto",
            /**
             * @name handle
             * @desc 设置拖拽元素的有效拖拽位置, 可以是一个选择器，也可以是一个DOM元素
             * @type string|jQuery
             * @default false
             */
            handle: false,
            /**
             * @name grid
             * @desc 设置拖拽元素
             * @type string|jQuery
             * @default false
             */
            grid: false,
            /**
             * @name containment
             * @desc 设置拖拽元素的容器，一旦设置容器，则该元素不能被拖出容器的边界
             * @type string|jQuery
             * @default "document"
             */
            containment: "document",
            /**
             * 当拖拽开始时触发。
             * @event open
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
            start: null,
            /**
             * 当拖拽过程中连续触发。
             * @event drag
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
            drag: null,
            /**
             * 当拖拽结束后触发。
             * @event stop
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
            stop: null

        },
        _create: function() {

            this.element.addClass("hui-draggable");

            // if(!(/^(?:r|a|f)/).test(this.element.css("position")))
            //     this.element[0].style.position = 'absolute';

            this._mouseInit();
        },

        _mouseCapture: function(event) {
            this.handle = this._getHandle(event);
            if (this.options.disabled || !this.handle || $(event.target).is('.hui-resize-handle'))
                return false;
            return true;
        },

        _initStatus: function(event) {
            var dragger = this.dragger,
                offset = dragger.offset();

            var scrollP = this.dragger.scrollParent();

            this.cssPosition = dragger.css("position");
            this.scrollParent = dragger.scrollParent();

            if (!(/^(?:r|a|f)/).test(this.cssPosition))
                dragger[0].style.position = 'absolute';

            this.status = {
                left: event.pageX - offset.left,
                top: event.pageY - offset.top,
                width: dragger.outerWidth(),
                height: dragger.outerHeight(),
                offset: {
                    parent: this._getParentOffset()
                }
            };

            this.original = this.position = this._generatePosition(event);
            this.original.pageX = event.pageX;
            this.original.pageY = event.pageY;

        },

        _mouseStart: function(event) {
            var position,
                o = this.options;

            this.dragger = this.element.addClass("hui-draggable-dragging");

            this._initStatus(event);

            if (o.containment)
                this._setContainment();

            if (this._trigger("start", event) === false) {
                this._clear();
                return false;
            }
            this._mouseDrag(event, true);

            return true;

        },

        _mouseDrag: function(event, noPropagation) {

            var o = this.options;
            this.position = this._generatePosition(event);

            if (!noPropagation) {
                var ui = this._uiHash();
                if (this._trigger('drag', event, ui) === false) {
                    this._mouseUp({});
                    return false;
                }
                this.position = ui.position;
            }

            if (!o.axis || o.axis !== "y")
                this.dragger[0].style.left = this.position.left + 'px';

            if (!o.axis || o.axis !== "x")
                this.dragger[0].style.top = this.position.top + 'px';

            $('body').css('cursor', o.cursor);

            return false;
        },

        _mouseStop: function(event) {
            var element = this.element[0],
                elementInDom = false;

            while (element && (element = element.parentNode)) {
                // jshint eqeqeq: false
                if (element == document) {
                    elementInDom = true;
                }
            }

            if (!elementInDom) return false;

            if (this._trigger("stop", event) !== false) {
                this._clear();
            }
            return false;
        },

        _clear: function() {
            this.dragger.removeClass("hui-draggable-dragging");
            this.dragger = null;
        },

        _uiHash: function(event) {
            return {
                position: this.position,
                original: this.original
            };
        },

        _generatePosition: function(event) {

            var o = this.options,
                pageX = event.pageX,
                pageY = event.pageY;

            if (this.original) { //If we are not dragging yet, we won't check for options
                var containment;
                if (this.containment) {
                    if (this.relative_container) {
                        var co = this.relative_container.offset();
                        containment = [this.containment[0] + co.left,
                            this.containment[1] + co.top,
                            this.containment[2] + co.left,
                            this.containment[3] + co.top
                        ];
                    } else {
                        containment = this.containment;
                    }

                    if (event.pageX - this.status.left < containment[0]) pageX = containment[0] + this.status.left;
                    if (event.pageY - this.status.top < containment[1]) pageY = containment[1] + this.status.top;
                    if (event.pageX - this.status.left > containment[2]) pageX = containment[2] + this.status.left;
                    if (event.pageY - this.status.top > containment[3]) pageY = containment[3] + this.status.top;
                }

                if (o.grid) {
                    //Check for grid elements set to 0 to prevent divide by 0 error causing invalid argument errors in IE (see ticket #6950)
                    var top = o.grid[1] ? this.original.pageY + Math.round((pageY - this.original.pageY) / o.grid[1]) * o.grid[1] : this.original.pageY;
                    pageY = containment ? (!(top - this.status.top < containment[1] || top - this.status.top > containment[3]) ? top : (!(top - this.status.top < containment[1]) ? top - o.grid[1] : top + o.grid[1])) : top;

                    var left = o.grid[0] ? this.original.pageX + Math.round((pageX - this.original.pageX) / o.grid[0]) * o.grid[0] : this.original.pageX;
                    pageX = containment ? (!(left - this.status.left < containment[0] || left - this.status.left > containment[2]) ? left : (!(left - this.status.left < containment[0]) ? left - o.grid[0] : left + o.grid[0])) : left;
                }

            }

            return {
                top: (
                    pageY - this.status.top - this.status.offset.parent.top + (this.cssPosition === 'fixed' ? -this.scrollParent.scrollTop() : 0)
                ),
                left: (
                    pageX - this.status.left - this.status.offset.parent.left + (this.cssPosition === 'fixed' ? -this.scrollParent.scrollLeft() : 0)
                )
            };

        },

        _setContainment: function() { //copy from jqui
            //Get a boundary of [left, top, right, bottom]
            //such as [20, 30, 1000, 400]
            var o = this.options;

            if (o.containment === 'parent') o.containment = this.dragger[0].parentNode;

            if (o.containment === 'document' || o.containment === 'window')
            //is window or doucment
                this.containment = [
                o.containment === 'document' ? 0 : $(window).scrollLeft() - this.status.offset.parent.left,
                o.containment === 'document' ? 0 : $(window).scrollTop() - this.status.offset.parent.top, (o.containment === 'document' ? 0 : $(window).scrollLeft()) + $(o.containment === 'document' ? document : window).width() - this.status.width, (o.containment === 'document' ? 0 : $(window).scrollTop()) + ($(o.containment === 'document' ? document : window).height() || document.body.parentNode.scrollHeight) - this.status.height
            ];

            if (!(/^(document|window)$/).test(o.containment) &&
                o.containment.constructor !== Array) {
                //is parent or selector
                var c = $(o.containment);
                var ce = c[0];
                if (!ce) return;
                var co = c.offset();
                var over = ($(ce).css("overflow") !== 'hidden');

                this.containment = [
                    (parseInt($(ce).css("borderLeftWidth"), 10) || 0) + (parseInt($(ce).css("paddingLeft"), 10) || 0), (parseInt($(ce).css("borderTopWidth"), 10) || 0) + (parseInt($(ce).css("paddingTop"), 10) || 0), (over ? Math.max(ce.scrollWidth, ce.offsetWidth) : ce.offsetWidth) - (parseInt($(ce).css("borderLeftWidth"), 10) || 0) - (parseInt($(ce).css("paddingRight"), 10) || 0) - this.status.width, (over ? Math.max(ce.scrollHeight, ce.offsetHeight) : ce.offsetHeight) - (parseInt($(ce).css("borderTopWidth"), 10) || 0) - (parseInt($(ce).css("paddingBottom"), 10) || 0) - this.status.height
                ];
                this.relative_container = c;

            } else if (o.containment.constructor === Array) {
                // is array
                this.containment = o.containment;
            }

        },

        _getParentOffset: function() {
            //get offset of relatived parent.

            this.offsetParent = this.dragger.offsetParent();
            var po = this.offsetParent.offset();

            // jshint eqeqeq: false
            if (this.cssPosition === 'absolute' && this.scrollParent[0] != document && $.contains(this.scrollParent[0], this.offsetParent[0])) {
                po.left += this.scrollParent.scrollLeft();
                po.top += this.scrollParent.scrollTop();
            }
            // jshint eqeqeq: false
            if ((this.offsetParent[0] == document.body) || //This needs to be actually done for all browsers, since pageX/pageY includes this information
                (this.offsetParent[0].tagName && this.offsetParent[0].tagName.toLowerCase() === 'html' && /msie ([\w.]+)/.test(navigator.userAgent.toLowerCase()))) //Ugly IE fix
                po = {
                top: 0,
                left: 0
            };

            return {
                top: po.top + (parseInt(this.offsetParent.css("borderTopWidth"), 10) || 0),
                left: po.left + (parseInt(this.offsetParent.css("borderLeftWidth"), 10) || 0)
            };

        },

        _getHandle: function(event) { //check if it's a valid handle

            var handle = this.options.handle,
                valid = !handle || !$(handle, this.element).length ? true : false;

            $(handle, this.element).find("*").andSelf().each(function() {
                // jshint eqeqeq: false
                if (this == event.target) valid = true;
            });

            return valid;
        },

        _destroy: function() {
            this.element.removeClass("hui-draggable");
            this._mouseDestroy();
        },

        plugins: {}
    });

})(jQuery);
/*global HUI,window,jQuery*/
(function ($) {
    'use strict';

    var DROPDOWN_HTML = '<div class="mod_dropdown_inputbox">' +
        '<input type="text" class="mod_form_txt mod_dropdown_input" id="#{0}" data-placeholder="#{1}" readonly="true"/>' +
        //'<input type="hidden" class="mod_dropdown_value" name="#{0}"/>' +//TODO
        '<i class="mod_dropdown_arw"></i>' +
        '<ul class="mod_dropdown_options clearfix"></ul>' +
        '<select class="mod_dropdown_select" name="#{0}"><option></option></select>' + //TODO
        '</div>';

    HUI.Widget.extend('Dropdown', {
        options: {
            //knockout: true, //todo
            /**
             * @name maxView
             * @desc 用来设置dropdown初始最多显示多少个item。
             * @type bool
             * @default false
             */
            maxView: 12,
            /**
             * @name width
             * @desc 用来设置dropdown的宽度。
             * @type number
             * @default false
             */
            width:false
        },

        _create: function () {
            var self = this,
                ele = self.element,
                name = ele.attr('data-name'),
                html = HUI.util.format(DROPDOWN_HTML, name, ele.attr('data-placeholder'));

            ele.html(html)
            self.trees = new Function('return ' + ele.attr('data-options'))(); //learn 获取字符串值

            self.opts = {};
            self.opts.name = ele.attr('data-name');
            self.opts.$optionsBox = ele.find('.mod_dropdown_options');
            self.opts.$selectBox = ele.find('.mod_dropdown_select'); //TODO
            //self.opts.$valueInput = ele.find('.mod_dropdown_value');//TODO
            self.opts.$textInput = ele.find('.mod_dropdown_input');

            self._createOptionItems();
        },

        _createOptionItems: function () {
            var self = this,
                ele = self.element,
                trees = self.trees,
                name = self.opts.name,
                textInput = self.opts.$textInput,
                optionsBox = self.opts.$optionsBox,
                selectBox = self.opts.$selectBox,
                o = self.options,
                text, value, li,
                liLen = o.maxView,
                width = o.width;

            if (trees.length > liLen) {
                optionsBox.css({
                    'height': textInput.height() * liLen + 'px',
                    'overflow-y': 'scroll'
                });
            }

            for (var i = 0; i < trees.length; i++) { //最好用变量记下tree.length
                text = trees[i].text;
                value = trees[i].value;
                $('<li title="' + text + '">' + text + '</li>')
                    .data('value', value)
                    .appendTo(optionsBox);
                $('<option value="' + value + '">' + text + '</option>').appendTo(selectBox); //TODO
            }

            self._setWidth(width ? width : selectBox.width());

            value = self.options.Value;
            self._setPlaceholder();
            value && self.Value(value);
            o.knockout && optionsBox.attr('data-bind', 'value:' + name);

            self._initBehavior();
        },

        _setWidth:function(width){ //this method need tobe modified
            var self = this,
                textInput = self.opts.$textInput,
                optionsBox = self.opts.$optionsBox;

            optionsBox.css({
                'width': width + 40 + 'px'
            });
            textInput.css({
                'width': width + 15 + 'px'
            });
        },

        _getText: function (value, index) {
            var self = this,
                trees = self.trees;

            for (var i = 0; i < trees.length; i++) {
                if (trees[i].value != value) {
                    continue;
                }
                else {
                    return !index ? trees[i].text : i + 1;
                }
            }
        },

        _initBehavior: function () {
            var self = this,
                selectBox = self.opts.$selectBox,
                optionsBox = self.opts.$optionsBox,
                li = optionsBox.find('li'),
                textInput = self.opts.$textInput;

            li.hover(function () {
                $(this).addClass('mod_dropdown_hover');
            }, function () {
                $(this).removeClass('mod_dropdown_hover');
            });

            textInput.on('click', function (e) {
                e.stopPropagation();
                self._inputSelectFun.call(self); //learn
            });

            optionsBox.on('click', 'li', function () {
                var value = $(this).data('value'),
                    index = $(this).index();
                if (self.value === value) {
                    return;
                }
                selectBox[0].selectedIndex = parseInt(index+1);
                selectBox.trigger('change');
            });

            selectBox.on('change', function () {
                var text = $(this).find('option:selected').text(),
                    val = $(this).val();
                self.change.call(self, {
                    text: text,
                    value: val
                });
            });

        },

        _inputSelectFun: function () { //learn
            var self = this,
                ele = self.element,
                textInput = self.opts.$textInput,
                inputSelectFun = function () {
                    self._inputSelectFun();
                },
                hideAllOptions = function () {
                    self._hideAllOptions();
                };

            if (ele.hasClass('mod_dropdown_box_expand')) { //优化加进options expandClassName
                self._hideAllOptions();
                $('document,body').off('click', inputSelectFun);
            }
            else {
                self._hideAllOptions();
                ele.addClass('mod_dropdown_box_expand');
                $('document,body').off('click', inputSelectFun);
                $('document,body').on('click', hideAllOptions);
            }

        },

        _hideAllOptions: function () {
            var self = this,
                dropBox = $('.mod_dropdown_box'); //优化 加进options
            dropBox.removeClass('mod_dropdown_box_expand');
        },

        _setPlaceholder: function () {
            var self = this,
                ele = self.element,
                name = self.opts.name,
                textInput = self.opts.$textInput,
                placeholder = textInput.attr('data-placeholder'),
                dropdownBox = ele.find('.mod_dropdown_inputbox');

            if (placeholder) {
                var data = self.options.knockout ? 'data-bind="visible:' + name + '()==\'\'"' : '';
                var html = '<span class="mod_dropdown_placeholder"' + data + '>' + placeholder + '</span>';
                dropdownBox.append(html);
                self.opts.$placeholder = ele.find('.mod_dropdown_placeholder');
            }
        },

        _hidePlaceholder: function () {
            var self = this;
            self.opts.$placeholder.hide();
        },

        change: function (ele) {
            var self = this,
                value = ele.value,
                text = ele.text,
                selectBox = self.opts.$selectBox;

            self.value = value;
            self.text = text;
            self._setValue(value);
            self._trigger('change', null, {
                value: value,
                text: text
            });
        },

        _getValue: function () {
            //var val = this.opts.$valueInput.val();

            //return val;
        },

        _setValue: function (value) {
            var self = this,
                //valueInput = self.opts.$valueInput,
                textInput = self.opts.$textInput,
                selectBox = self.opts.$selectBox,
                placeholder = self.opts.$placeholder;

            //valueInput.val(value);
            textInput.val(self._getText(value));
            selectBox[0].selectedIndex = self._getText(value, true);
            placeholder && self._hidePlaceholder();
        },
        
        /**
        获取或设置当前下拉框的值.
        @param {number} - 设置当前下拉框的值
        @returns {number} 获取当前下拉框的值（如果没有参数传入的话）.
        */
        Value: function (value) {
            var self = this;
            if (value === undefined) {
                return self._getValue();
            }
            self._setValue(value);
        }
    });
})(jQuery);
/*global jQuery, window, HUI*/

(function($) {
    "use strict";

    var active = false;

    HUI.Widget.extend("DropMenu", {
        
        options: {
            /**
             * @name mode
             * @desc 决定下拉菜单如何触发弹出，有hover和click两种方式
             * @type string
             * @default 'hover'
             */
            mode: 'hover',
            /**
             * @name align
             * @desc 决定下拉菜单的对齐方式，有'left'和'right'两种方式
             * @type string
             * @default 'hover'
             */
            align: 'left',
            /**
             * @name boundary
             * @desc 决定下拉菜单的边界
             * @type DOM
             * @default window
             */
            boundary: HUI.$win,
            /**
             * @name delay
             * @desc 决定下拉菜单弹出的延迟时间
             * @type number
             * @default 0
             */
            delay: 0,
            /**
             * @name duration
             * @desc 决定下拉菜单弹出动画的延续时间
             * @type number
             * @default 200
             */
            duration:200,
            /**
             * 当下拉菜单打开时触发。
             * @event open
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
            open: null,
            /**
             * 当下拉菜单隐藏触发。
             * @event close
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
            close: null
        },

        _create: function() {
            var o = this.options,
                el = this.element;
            
            el.addClass("hui-dropmenu");

            this.trigger = el.find(">.hui-dropmenu-trigger");
            this.menu = el.find(">.hui-dropmenu-menu");
            this._bindEvents();
        },

        _bindEvents: function() {
            var self = this, el = this.element,
                trigger;

            if (this.options.mode === "click") {
                this.element.on("click", function(e) {
                    var $target = $(e.target);

                    if(!el.hasClass('hui-dropmenu-open')){
                        self.show();
                    }
                    else if($target.is(".hui-dropmenu-trigger")){
                        self.hide();
                    }
                });
                
            } else {
                this.element.on("mouseenter", function(e) {
                    if (self.remainIdle) {
                        clearTimeout(self.remainIdle);
                    }

                    self.show();

                }).on("mouseleave", function() {
                    self.remainIdle = setTimeout(function() {
                        self.remainIdle = false;
                        self.hide();
                    },200);
                });
            }


        },

        _registerOuterClick: function(){
            var self = this;

            HUI.$doc.off("click.dropmenu");
            setTimeout(function() {

            HUI.$doc.bind("click.dropmenu", function(e) {
                // jshint eqeqeq: false
                if(active && active[0] == self.element[0] && !active.find(e.target).length) {
                    self.hide();
                    HUI.$doc.off("click.dropmenu");
                }
            });
            }, 10);
        },

        /**
        打开Dropmenu
        @returns {jQuery} 
        */
        show: function() {
            var d = this.options.duration;

            // jshint eqeqeq: false
            if (active && active[0] != this.element[0]) {
                active.removeClass("hui-dropmenu-open");
            }

            this.element.addClass("hui-dropmenu-open");

            if(d) this.menu.hide().fadeIn(d);

            active = this.element;
            this._registerOuterClick();

            this._trigger("open", null, null);
        },

        /**
        关闭Dropmenu
        @returns {jQuery} 
        */
        hide: function() {
            var d = this.options.duration;
            this.element.removeClass("hui-dropmenu-open");
            // jshint eqeqeq: false
            if (active && active[0] == this.element[0]) active = false;

            if(d) this.menu.show().fadeOut(d);

            this._trigger("close", null, null);
        }
    });

})(jQuery);
/*global jQuery, window, HUI*/

(function($) {
    "use strict";

    var easings = {
            easeOutCubic: function(t) {
                return 1 * ((t = t / 1 - 1) * t * t + 1);
            }
        },

        drawDonut = function(context, width, height, outerRadius, innerRadius, beginAngle, endAngle, color, strokeWidth, strokeColor, clockwise) {
            context.beginPath();

            context.arc(width / 2, height / 2,
                outerRadius,
                beginAngle,
                endAngle, !clockwise);

            context.arc(width / 2,
                height / 2,
                innerRadius,
                endAngle,
                beginAngle,
                clockwise);

            context.closePath();
            context.fillStyle = color;
            context.fill();

            if (strokeWidth) {
                context.lineWidth = strokeWidth;
                context.strokeStyle = strokeColor;
                context.stroke();
            }
        },

        isNumber = function(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        },

        getValidNum = function(val, max, min) {
            if (isNumber(max) && val > max) {
                return max;
            }
            if (isNumber(min) && val < min) {
                return min;
            }
            return val;
        },

        requestAnimFrame = (function() {
            return window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function(callback) {
                    window.setTimeout(callback, 70);
                };
        })();

    HUI.Widget.extend("DonutProgressbar", {
        options: {
            data: [],
            /**
             * @name bgColor
             * @desc 设置当前进度条的背景颜色
             * @type string
             * @default "#e4e7e9"
             */
            bgColor: "#e4e7e9",
            /**
             * @name strokeColor
             * @desc 设置当前进度条的边框颜色
             * @type string
             * @default "#eee"
             */
            strokeColor: "#eee",
            /**
             * @name strokeWidth
             * @desc 设置当前进度条的边框宽度
             * @type string
             * @default "#eee"
             */
            strokeWidth: 0,
            /**
             * @name innerRadius
             * @desc 设置当前进度条的内圈半径占外圈半径的百分比
             * @type number
             * @default 75
             */
            innerRadius: 75,
            /**
             * @name max
             * @desc 设置当前进度条最大值
             * @type number
             * @default 100
             */
            max: 100,
            /**
             * @name startAngle
             * @desc 设置当前进度条起始角度
             * @type number
             * @default -Math.PI / 2
             */
            startAngle: -Math.PI / 2,
            /**
             * Donut animatetion params
             * @type {Object}
             */
            animation: {
                /**
                 * @name steps
                 * @type number
                 * @default 80
                 * @desc 设置动画的步数
                 */
                steps: 80,
                /**
                 * @name easing
                 * @type string
                 * @default "easeOutCubic"
                 * @desc 设置easing效果
                 */
                easing: "easeOutCubic",
                /**
                 * @name rotate
                 * @type bool
                 * @default true
                 * @desc 是否进行旋转动画
                 */
                rotate: true,
                /*rotate animate*/
                /**
                 * @name scale
                 * @type bool
                 * @default false
                 * @desc 是否进行缩放动画
                 */
                scale: false /*scale animate*/
            },
            /**
             * @name clockwise
             * @desc 设置当前进度条旋转方向是顺时针还是逆时针
             * @type bool
             * @default true
             */
            clockwise: true,
            /**
             * 当进度条进度完成时触发
             * @event complete
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
            complete: null,
            /**
             * 当进度条进度滚动时触发(连续触发事件)。
             * @event progress
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
            progress: null
        },

        _create: function() {
            var element = this.element[0];
            if (!element.getContext && window.G_vmlCanvasManager) {
                this.options.animation.steps = 10000;
                element = window.G_vmlCanvasManager.initElement(element);
                this._handledWithVML = true;
            }

            var cxt = this.context = element.getContext("2d"),
                width = cxt.canvas.width,
                height = cxt.canvas.height,
                /*High pixel density displays - multiply the size of the 
                canvas height/width by the device pixel ratio, then scale.*/
                ratio = window.devicePixelRatio;

            this.bound = {
                width: width,
                height: height
            };

            if (ratio) {
                cxt.canvas.style.width = width + "px";
                cxt.canvas.style.height = height + "px";
                cxt.canvas.height = height * ratio;
                cxt.canvas.width = width * ratio;
                cxt.scale(ratio, ratio);
            }
            this.draw();
        },

        _clear: function(self) {
            self.context.clearRect(0, 0, self.bound.width, self.bound.height);
        },

        /**
        绘制环形进度条.
        @returns {jQuery} 
        */
        draw: function() {
            var self = this,
                o = self.options,
                a = o.animation,
                d = o.data,
                sa = o.startAngle,
                length,
                height = self.bound.height,
                width = self.bound.width,
                radius = Math.min(height / 2, width / 2) - 5,
                innerRadius = radius * (o.innerRadius / 100);

            self._animate(function(easedPercent) {
                var scaleRadio = 1,
                    or, ir,
                    rotateRadio = 1;

                if (o.animation) { //init anim at 2 dimension
                    a.scale && (scaleRadio = easedPercent);
                    a.rotate && (rotateRadio = easedPercent);
                }
                or = scaleRadio * radius;
                ir = scaleRadio * innerRadius;
                self._drawBackground(self.context, width, height, or, ir, o.bgColor, o.strokeWidth, o.strokeColor, o.clockwise);

                if (d && (length = d.length)) {
                    for (var i = 0; i < length; i++) {
                        var progressAngle = rotateRadio * ((d[i].value / o.max) * (Math.PI * 2)) * (o.clockwise ? 1 : -1),
                            ior = d[i].radius || or,
                            iir = d[i].innerRadius || ior * (o.innerRadius / 100);

                        //workaround for IE vml bug
                        if (self._handledWithVML) {
                            progressAngle = progressAngle > 6.28 ? (progressAngle - 0.001) : (progressAngle || 0.001);
                        }

                        self._drawProgress(self.context, width, height, ior, iir, sa, sa + progressAngle,
                            d[i].color, o.strokeWidth, o.strokeColor, o.clockwise);
                    }
                }

                self._trigger("progress", null, {
                    value: easedPercent
                });
            });
        },

        _drawBackground: function(context, width, height, outerRadius, innerRadius, color, strokeWidth, strokeColor, clockwise) {
            drawDonut(context, width, height, outerRadius, innerRadius, 0, Math.PI * 2, color, strokeWidth, strokeColor, clockwise);
        },

        _drawProgress: function(context, width, height, outerRadius, innerRadius, sa, ea, color, strokeWidth, strokeColor, clockwise) {
            drawDonut(context, width, height, outerRadius, innerRadius, sa, ea, color, strokeWidth, strokeColor, clockwise);
        },

        _animate: function(drawData) {
            var self = this,
                o = self.options,
                a = o.animation,
                stepAmount = a ?
                1 / getValidNum(a.steps, Number.MAX_VALUE, 1) : 1,
                easing = easings[a.easing],
                percent = a ? 0 : 1,
                easedPercent,

                animateFrame = function() {
                    easedPercent = a ? getValidNum(easing(percent), null, 0) : 1;
                    self._clear(self);
                    drawData(easedPercent);
                },

                callback = function() {
                    percent += stepAmount;
                    animateFrame();
                    //Stop the loop continuing forever
                    if (percent <= 1) {
                        requestAnimFrame(callback);
                    } else {
                        self._trigger("complete", null, {
                            value: easedPercent
                        });
                    }
                };

            requestAnimFrame(callback);
        }
    });

})(jQuery);
/*global jQuery, window, HUI*/

(function($) {
    "use strict";

    HUI.Widget.extend("Evcal", {
        options: {
            /**
             * @name now
             * @desc 定义了当前时间，可以又服务器端传入，默认使用客户端当前时间
             * @type date
             * @default null
             */
            now: null,
            /**
             * @name events
             * @desc 定义了行事历的事件数组, 其中数组成员的格式如下
             * {
             *     start: new Date(startdate),
             *     end: new Date(enddate),
             *     title: 'XXX'
             * }
             * @type date
             * @default null
             */
            events: [],
            /**
             * @name region
             * @desc 定义语言版本，默认为中文，同时还支持英文等，用户可以通过HUI.widgets.evcal.prototype.regional访问多语言集
             * @type string
             * @default 'default'
             */
            region: 'default',
            /**
             * @name monthFormat
             * @desc 定义日历标题部分月份显示的格式
             * @type string
             * @default '{year}年{month}月'
             */
            monthFormat: '{year}年{month}月',
            /**
             * @name itemTemplate
             * @desc 定义了calendar每日视图的模板，可以是一段包含HTML的字串，也可以使一个function
             * @type string|function
             * @default null
             */
            itemTemplate: null,
            /**
             * @name region
             * @desc 定义Calendar的事件是否按日显示
             * @type bool
             * @default false
             */
            seperatedEvent: false,
            /**
             * 当鼠标悬停到某一日时触发。
             * @event hover
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
            hover: null,
            /**
             * 当鼠标点击某一日时触发。
             * @event click
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
            click: null,
            /**
             * 当点击下一月时触发。
             * @event prevClick
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */    
            prevClick: null,
            /**
             * 当点击上一月时触发。
             * @event nextClick
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */ 
            nextClick: null
        },

        regional: {
            "default": {
                datNames: ['日', '一', '二', '三', '四', '五', '六']
            },
            "en": {
                datNames: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
            }
        },

        _create: function() {
            this.status = {};
            this._initEvents();
            this._renderHTML();
            this._bindEvents();
        },

        _initEvents: function() {
            var ev = this.options.events,
                len = ev.length;

            for (var i = 0; i < len;) {
                ev[i]._id || (ev[i]._id = ++i);
            }
        },

        /**
        在datepicker绘制结束后进行一些装饰
        @param {function} callback 对单日的HTML结构进行自定义
        @returns {jQuery} 
        */
        decorateCal: function(callback) {
            var s = this.status;
            this.$cal.find('.hui-cal-column').each(function() {
                var $item = $(this),
                    year = $item.attr("data-year"),
                    month = $item.attr("data-month"),
                    date = $(this).attr("data-date");
                callback.call(this, $item, new Date(year, month, date));
            });
        },

        _renderHTML: function() {
            var today, year, month, $content = $('<div class="hui-cal-content"></div>');

            today = this._getDate(this.options.now) || new Date();
            this.today = today = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate());

            this.status.curYear = year = today.getFullYear();
            this.status.curMonth = month = today.getMonth();

            this.element.addClass("hui-cal");

            this.$header = this._renderHeader().appendTo(this.element);
            $content.appendTo(this.element);
            this.$week = this._renderWeek().appendTo($content);
            this.$cal = $('<div>').html(this._renderCal(year, month))
                .appendTo($content);
            this._renderEvent();
        },

        _renderHeader: function() {
            var $header = $('<div class="hui-cal-header"></div>');

            this.$monthTitle = $('<span class="hui-text"></span>').appendTo($header);
            this.$next = $('<a class="hui-cal-next-btn"></a>').appendTo($header);
            this.$prev = $('<a class="hui-cal-prev-btn"></a>').appendTo($header);
            this._refreshMonthTitle();

            return $header;
        },

        _refreshMonthTitle: function() {
            var month = this.options.monthFormat
                .replace(/\{year\}/, this.status.curYear)
                .replace(/\{month\}/, this.status.curMonth + 1);

            this.$monthTitle.html(month);
        },


        _renderCal: function(year, month) {
            var self = this,
                o = self.options,
                curDate, startDate, numRows, firstDay,
                calHtml = '', viewStart, viewEnd,
                colStyle = "hui-cal-column";

            firstDay = self._getFirstDayOfMonth(year, month);
            numRows = Math.ceil((self._getDaysInMonth(year, month) + firstDay) / 7);
            numRows > 5 && (colStyle += " hui-cal-column-six");
            var printDate = self._daylightSavingAdjust(new Date(year, month, 1 - firstDay));
            viewStart = printDate.getFullYear() + ',' + printDate.getMonth() + ',' + printDate.getDate();

            for (var dRow = 0; dRow < numRows; dRow++) {
                calHtml += '<div class="hui-cal-row">';
                for (var dow = 0; dow < 7; dow++) {
                    var otherMonth = (printDate.getMonth() !== month),
                        isToday = printDate.getTime() === self.today.getTime();

                    calHtml += '<div class="' + colStyle + 
                        (otherMonth ? ' hui-cal-other-month' : '') +
                        (isToday ? ' hui-cal-today' : '') + '"';

                    calHtml += self._checkEvent(printDate, o.events);
                    calHtml += ' data-year="' + printDate.getFullYear() +
                        '" data-month="' + printDate.getMonth() +
                        '" data-date="' + printDate.getDate() + '">';

                    if (o.itemTemplate) {
                        if (typeof o.itemTemplate === 'function') {
                            var customItem = o.itemTemplate.call(self, printDate);
                            typeof customItem === 'string' && (calHtml += customItem);
                        } else if (typeof o.itemTemplate === 'string') {
                            calHtml += o.itemTemplate.replace(/\{date\}/g, printDate.getDate());
                        }
                    } else {
                        calHtml += '<span class="hui-cal-date">' + printDate.getDate() + '</span>';
                    }

                    calHtml += '</div>';

                    printDate.setDate(printDate.getDate() + 1);
                    printDate = this._daylightSavingAdjust(printDate);
                }

                calHtml += '</div>';
            }

            viewEnd = printDate.getFullYear() + ',' + printDate.getMonth() + ',' + printDate.getDate();

            self.element.data({
                viewStart: viewStart,
                viewEnd: viewEnd
            });

            return calHtml;
        },

        _checkEvent: function(date, events) {
            var len = events.length,
                evList = [];

            for (var i = 0; i < len; i++) {
                var ev = events[i];
                if (ev.end && ev.start && ev.start <= date &&
                    ev.end >= date) {
                    evList.push(ev._id);
                }
            }

            return evList.length ?
                ' data-event=' + evList.join(',') + ' ' :
                '';
        },

        _renderEvent: function() {
            var events = this.options.events;

            if (!this.$cal) {
                return;
            }

            if (this.options.seperatedEvent) {
                var $items = this.$cal.find('.hui-cal-column[data-event]');
                if (!$items.length) return;
                $items.each(function() {
                    var item = $(this),
                        $event;
                    $.each(events, function() {
                        var ev = this,
                            evsOnItem = item.attr('data-event'),
                            idx = evsOnItem.indexOf(ev._id);

                        //todo: render daily event.
                        if (~idx) {
                            $event = $('<div class="hui-cal-event-seperate" title="' +
                                (ev.title || '') + '"></div>')
                                .css({
                                    "background-color": ev.color
                                })
                                .appendTo(item);

                            if (idx) $event.css({
                                "bottom": (idx / 2) * 11
                            });
                        }
                    });
                });
                return;
            }

            this.$cal.find('.hui-cal-row').each(function() {
                var $row = $(this),
                    items = $row.children('div[data-event]');

                if (!items.length) return;

                $.each(events, function() {
                    var ev = this,
                        left, width, fItem, lItem, $event, evIdx;

                    items.each(function() {
                        var item = $(this),
                            evsOnItem = item.attr('data-event'),
                            idx = evsOnItem.indexOf(ev._id);

                        if (~idx) {
                            fItem = fItem || item;
                            lItem = item;
                            evIdx = idx / 2;
                        }
                    });

                    if (!fItem) return;

                    left = fItem.offset().left;
                    width = lItem.offset().left +
                        lItem.width() - left;

                    $event = $('<div class="hui-cal-event" title="' +
                        (ev.title || '') + '"></div>')
                        .appendTo($row)
                        .offset({
                            left: left
                        })
                        .width(width);

                    if (evIdx) $event.css({
                        "bottom": evIdx * 11
                    });

                    if (ev.color) $event.css({
                        "background-color": ev.color
                    });

                });
            });

        },

        _renderWeek: function() {
            var weekHtml = '<div  class="hui-cal-week">',
                days = this.regional[this.options.region].datNames;

            for (var dow = 0; dow < 7; dow++) {
                weekHtml += '<div class="hui-cal-weekday">' +
                    '<span title="' + days[dow] + '">' + days[dow] + '</span></div>';
            }
            weekHtml += '</div>';

            return $(weekHtml);
        },

        _adjustMonth: function(offset) {
            var self = this, date;

            self.status.curMonth += offset;
            date = new Date(self.status.curYear, self.status.curMonth, 1);
            self.status.curYear = date.getFullYear();
            self.status.curMonth = date.getMonth();

            self.$cal.empty();
            self.$cal.html(self._renderCal(self.status.curYear, self.status.curMonth));
            self._renderEvent();
            self._refreshMonthTitle();
        },

        _bindEvents: function() {
            var self = this,
                o = self.options;

            self.$cal.delegate(".hui-cal-column", {
                "hover": function(event) {
                    self._trigger("hover", null, this);
                },
                "click": function(event) {
                    self._trigger("click", null, this);
                }
            });

            self.$prev.bind('click', function() {
                self._adjustMonth(-1);
                self._trigger("prevClick", null, {
                    year: self.status.curYear,
                    month: self.status.curMonth
                });
            });

            self.$next.bind('click', function() {
                self._adjustMonth(1);
                self._trigger("nextClick", null, {
                    year: self.status.curYear,
                    month: self.status.curMonth
                });
            });
        },

        _getDate: function(date) {
            return date && new Date(date);
        },

        /* Find the number of days in a given month. */
        _getDaysInMonth: function(year, month) {
            return 32 - this._daylightSavingAdjust(new Date(year, month, 32)).getDate();
        },

        /* Find the day of the week of the first of a month. */
        _getFirstDayOfMonth: function(year, month) {
            return new Date(year, month, 1).getDay();
        },

        /* Handle switch to/from daylight saving.*/
        _daylightSavingAdjust: function(date) {
            if (!date) return null;
            date.setHours(date.getHours() > 12 ? date.getHours() + 2 : 0); //verify this method
            return date;
        }
    });

})(jQuery);
/*global jQuery, window, HUI*/

(function($) {
    "use strict";

    HUI.Widget.extend("Hotarea", {
        options: {            
            /**
             * @name links
             * @type Array
             * @default []
             * @desc 设置当前图片的热链区域， 格式如下：
             * {
             *  src: 'link src'
             *  size:{
             *    width: 100,
             *    height:80
             *  },
             *  position:{
             *    left:100,
             *    top:120
             *  }
             * }
             */
            links: []
        },

        _setAttr: function() {
            var offset = this.element.offset();

            this.container.css({
                position: 'absolute',
                overflow: 'hidden',
                left: offset.left,
                'z-index': 1,
                top: offset.top,
                width: this.element.width(),
                height: this.element.height()
            });
        },


        _create: function() {
            var self = this;

            this.container = $("<div>").appendTo("body");

            if (this.element.is('img')) {
                this.element.bind('load', function() {
                    self._setAttr();

                    self._createLinks();
                });
            }

        },

        _createLinks: function() {
            var links = this.options.links;

            for (var i = 0, len = links.length; i < len; i++) {

                var item = links[i],
                    $link = $("<a>").css({
                        display: 'block',
                        position: 'absolute',
                        left: item.position.left,
                        top: item.position.top,
                        width: item.size.width,
                        height: item.size.height
                    }).attr("href", item.src);

                $link.appendTo(this.container);

            }
        }
    });

})(jQuery);
/*global jQuery*/
/*
 * hui.hoteditor
 * Depends:
 *  hui.mouse.js
 */

(function($) {
	"use strict";

	var Mouse = HUI.widgets.Mouse;

	Mouse.extend("HotEditor", {
		options: {
			/**
             * @name linksData
             * @type Array
             * @default []
             * @desc 设置当前图片的热链区域， 格式如下：
             * {
             *  src: 'link src'
             *  size:{
             *    width: 100,
             *    height:80
             *  },
             *  position:{
             *    left:100,
             *    top:120
             *  }
             * }
             */
			linksData: [],
			/**
             * @name distance
             * @type number
             * @default 8
             * @desc 设置热链区域的最小反应半径
             */
			distance: 8,
			/**
             * 当鼠标缩放热链大小时触发。
             * @event drag
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
			drag: null,
			/**
             * 当热链加入到图片区域时触发。
             * @event added
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
			added: null,
			/**
             * 当热链移除后触发。
             * @event removed
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
			removed: null,
			/**
             * 当热链选中后触发。
             * @event selected
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
			selected: null
		},

		_setAttr: function() {
			var offset = this.element.offset();

			this.container.css({
				cursor: 'pointer',
				position: 'absolute',
				left: offset.left,
				'z-index': 1,
				top: offset.top,
				width: this.element.width(),
				height: this.element.height()
			});

			this.options.linksData && this._createLinks();
			this._initBehavior();
		},

		_mouseProxy: function() {
			return this.container;
		},

		_getCreateEventData: function() {
			return {
				el: this.container
			};
		},

		_create: function() {

			var self = this;

			this.links = [];
			this.container = $("<div>").appendTo("body");

			if (this.element.is('img')) {
				this.element.bind('load', function() {
					self._setAttr();
				});
			}

			this._mouseInit();
		},

		_initBehavior: function() {
			var link = $('.hui-link'),
				self = this,
				findLink = function(link, action) {
					for (var i = 0, len = self.links.length; i < len; i++) {
						var item = self.links[i];
						if (link == item.el[0]) {
							action.call(self, item, i);
							break;
						}
					}
				};

			this.container.delegate('.hui-link', 'click', function() {

				self.container.find('.hui-link').removeClass("selected");
				$(this).addClass("selected").focus();

				findLink(this, function(item) {
					self._trigger('selected', null, item);
				});

			}).delegate('.hui-link', 'keydown', function(event) {
				if (event.keyCode === HUI.keyCode.DELETE) {
					$(this).remove();
					findLink(this, function(item, idx) {
						self.links.splice(idx, 1);
						self._trigger('removed', null, item);
					});
				}
			});
		},

		_createLinks: function() {
			var links = this.options.linksData;

			for (var i = 0, len = links.length; i < len; i++) {
				var item = links[i],
					$link = $("<a>").css({
						display: 'block',
						position: 'absolute',
						left: item.left,
						top: item.top,
						width: item.width,
						height: item.height
					}).attr({
						"class": "hui-link",
						"tabIndex": -1
					}),
					linkItem = {
						el: $link,
						state: {}
					};

				$link.appendTo(this.container);
				$.extend(linkItem.state, item);
				this.links.push(linkItem);
				this._trigger('added', null, linkItem);
			}
		},

		_mouseStart: function(event) {

			var self = this,
				link = this.link = $('<div class="hui-link">'),
				offset;

			offset = this.container.offset();

			this.originPosition = {
				left: event.pageX,
				top: event.pageY
			};

			this.start = {
				left: event.pageX - offset.left,
				top: event.pageY - offset.top
			};

			link.css(this.start).attr("tabIndex", -1);
			link.appendTo(this.container);
		},

		_mouseDrag: function(event) {

			var link = this.link,
				size = {
					width: event.pageX - this.originPosition.left,
					height: event.pageY - this.originPosition.top
				};

			link.css(size);

			this._curStatus = {
				width: size.width,
				height: size.height,
				left: this.start.left,
				top: this.start.top
			};

			this._trigger('drag', null, this._curStatus);
		},

		_mouseStop: function(event) {
			var link = {
				el: this.link,
				state: this._curStatus
			};

			this._trigger('added', null, link);
			this.links.push(link);
		},

		/**
		获取当前所有热链接
		@returns {Array} 当前所有热链接
		*/
		getAllLinks: function() {
			return this.links;
		},

		/**
		清除当前所有热链接
		@returns {Array} 当前所有热链接
		*/
		clearLinks: function() {
			this.links = [];
			return this.links;
		},

		/**
		刷新当前热链接区域
		@returns {jQuery} 当前element
		*/
		refresh: function() {
			var offset = this.element.offset();

			this.container.css({
				cursor: 'pointer',
				position: 'absolute',
				left: offset.left,
				'z-index': 1,
				top: offset.top,
				width: this.element.width(),
				height: this.element.height()
			});
		},

		_destroy: function() {
			this.container.remove();
			Mouse.prototype._mouseDestroy.call(this);
		}
	});
})(jQuery);
/*global jQuery, HUI*/

(function($) {
	"use strict";
	var Mouse = HUI.widgets.Mouse;

	Mouse.extend("Resize", {
		options: {
			/**
			 * @name minWidth
			 * @desc 设置元素的最小缩放宽度
			 * @type number
			 * @default 10
			 */
			minWidth: 10,
			/**
			 * @name minHeight
			 * @desc 设置元素的最小缩放高度
			 * @type number
			 * @default 10
			 */
			minHeight: 10,
			/**
			 * @name maxWidth
			 * @desc 设置元素的最大缩放宽度, 当设为null时意味着不设上限
			 * @type number
			 * @default null
			 */
			maxWidth: null,
			/**
			 * @name maxHeight
			 * @desc 设置元素的最大缩放高度, 当设为null时意味着不设上限
			 * @type number
			 * @default null
			 */
			maxHeight: null,
			/**
			 * @name handles
			 * @desc 设置被缩放元素各个方向的handle(最多8个)
			 * possible value: 'n,e,s,w,se,sw,ne,nw,all';
			 * @type string
			 * @default "e,s,se"
			 */
			handles: "e,s,se",
			/**
			 * @name alsoResize
			 * @desc 设置缩放元素同时被缩放的元素(可以使选择器，也可以是jQuery对象)
			 * @type string|jQuery
			 * @default false
			 */
			alsoResize: false,
			/**
			 * 当缩放开始时触发。
			 * @event start
			 * @param {jQuery.Event} e
			 * @param {jQuery} data
			 */
			start: null,
			/**
			 * 在缩放过程中连续触发。
			 * @event resize
			 * @param {jQuery.Event} e
			 * @param {jQuery} data
			 */
			resize: null,
			/**
			 * 缩放结束后触发。
			 * @event stop
			 * @param {jQuery.Event} e
			 * @param {jQuery} data
			 */
			stop: null

		},
		_create: function() {
			var self = this, axis;

			this.element.addClass("hui-resize");
			this.original = {};
			this.current = {};
			this._createHandles();
			this._handles = $('.hui-resize-handle', this.element)
				.disableSelection();

			//get current reszie direction.
			this._handles.mouseover(function() {
				if (!self.resizing) {
					if (this.className)
						axis = this.className.match(/hui-resize-(se|sw|ne|nw|n|e|s|w)/i);
					self.axis = axis && axis[1] ? axis[1] : 'se'; //default = se
				}
			});

			this._mouseInit();
		},

		_createHandles: function() {
			var o = this.options,
				handles = o.handles === 'all' ? 'n,e,s,w,se,sw,ne,nw' : o.handles,
				n = handles.split(",");

			this.handles = {};

			for (var i = 0; i < n.length; i++) {
				var handle = n[i],
					axis,
					hc = "hui-resize-" + handle,
					htext = '<div style="z-index:2000" class="hui-resize-handle ' + hc + '"></div>';

				axis = $(htext);
				this.handles[handle] = axis;
				this.element.append(axis);
			}
		},

		_uiHash: function(event) {
			return {
				current: this.current,
				original: this.original
			};
		},

		_mouseCapture: function(event) { //resize enabled when hover on handles
			var handle = false;

			for (var i in this.handles) {
				// jshint eqeqeq: false
				if (this.handles[i][0] == event.target) {
					handle = true;
				}
			}

			return !this.options.disabled && handle;
		},

		_mouseStart: function(event) {
			var self = this,
				el = this.element,
				o = self.options,
				curleft = num(el.css('left')),
				curtop = num(el.css('top'));

			//TODO: if it has a container.
			//if (o.containment) {
			//curleft += $(o.containment).scrollLeft() || 0;
			//curtop += $(o.containment).scrollTop() || 0;
			//}

			this.resizing = true;

			this.current.position = {
				left: curleft,
				top: curtop
			};
			this.current.size = {
				width: el.width(),
				height: el.height()
			};
			this.original.position = {
				left: curleft,
				top: curtop
			};
			this.original.size = {
				width: el.width(),
				height: el.height()
			};
			this.original.mouse = {
				left: event.pageX,
				top: event.pageY
			};

			var cursor = $('.hui-resize-' + this.axis).css('cursor');
			$('body').css('cursor', cursor === 'auto' ? this.axis + '-resize' : cursor);

			this._propagate("start", event);
			return true;
		},

		_mouseDrag: function(event) {
			var self = this,
				el = self.element,
				o = self.options,
				cur = this.current,
				dir = this.axis,
				smp = this.original.mouse,
				dx = (event.pageX - smp.left) || 0,
				dy = (event.pageY - smp.top) || 0,
				trigger = this._change[dir];

			if (!trigger) return false;
			// Calculate the position that will be change
			var data = trigger.apply(this, [event, dx, dy]);
			self._restrictBoundary(data);

			el.css({
				top: cur.position.top + "px",
				left: cur.position.left + "px",
				width: cur.size.width + "px",
				height: cur.size.height + "px"
			});

			this._updateCache(data);

			this._propagate('resize', event);
		},

		_mouseStop: function(event) {
			this.resizing = false;
			$('body').css('cursor', 'auto');
			this._propagate('stop', event);
			return false;
		},

		_updateCache: function(data) {
			var o = this.options;
			if (isNumber(data.left)) this.current.position.left = data.left;
			if (isNumber(data.top)) this.current.position.top = data.top;
			if (isNumber(data.height)) this.current.size.height = data.height;
			if (isNumber(data.width)) this.current.size.width = data.width;
		},

		_restrictBoundary: function(data) {

			var el = this.helper,
				o = this.options,
				a = this.axis,
				ismaxw = isNumber(data.width) && o.maxWidth && (o.maxWidth < data.width),
				ismaxh = isNumber(data.height) && o.maxHeight && (o.maxHeight < data.height),
				isminw = isNumber(data.width) && o.minWidth && (o.minWidth > data.width),
				isminh = isNumber(data.height) && o.minHeight && (o.minHeight > data.height);

			if (isminw) data.width = o.minWidth;
			if (isminh) data.height = o.minHeight;
			if (ismaxw) data.width = o.maxWidth;
			if (ismaxh) data.height = o.maxHeight;

			var dw = this.original.position.left + this.original.size.width,
				dh = this.current.position.top + this.current.size.height,
				cw = /sw|nw|w/.test(a),
				ch = /nw|ne|n/.test(a);

			if (isminw && cw) data.left = dw - o.minWidth;
			if (ismaxw && cw) data.left = dw - o.maxWidth;
			if (isminh && ch) data.top = dh - o.minHeight;
			if (ismaxh && ch) data.top = dh - o.maxHeight;

			return data;
		},

		_change: {
			e: function(event, dx, dy) {
				return {
					width: this.original.size.width + dx
				};
			},
			w: function(event, dx, dy) {
				var cs = this.original.size,
					sp = this.original.position;
				return {
					left: sp.left + dx,
					width: cs.width - dx
				};
			},
			n: function(event, dx, dy) {
				var cs = this.original.size,
					sp = this.original.position;
				return {
					top: sp.top + dy,
					height: cs.height - dy
				};
			},
			s: function(event, dx, dy) {
				return {
					height: this.original.size.height + dy
				};
			},
			se: function(event, dx, dy) {
				return $.extend(this._change.s.apply(this, arguments),
					this._change.e.apply(this, [event, dx, dy]));
			},
			sw: function(event, dx, dy) {
				return $.extend(this._change.s.apply(this, arguments),
					this._change.w.apply(this, [event, dx, dy]));
			},
			ne: function(event, dx, dy) {
				return $.extend(this._change.n.apply(this, arguments),
					this._change.e.apply(this, [event, dx, dy]));
			},
			nw: function(event, dx, dy) {
				return $.extend(this._change.n.apply(this, arguments),
					this._change.w.apply(this, [event, dx, dy]));
			}
		},

		_destroy: function() {
			this.element.removeClass("hui-resize");
		},

		_propagate: function(i, event){
			var ui = this._uiHash();
			for(var key in this.plugins) {
				var plugin = this.plugins[key];
				if(typeof plugin[i] === 'function') {
					plugin[i].call(this, [event, ui]);
				}
			}

			this._trigger(i, event, ui);
		},

		plugins: {}
	});

	var num = function(v) {
		return parseInt(v, 10) || 0;
	};

	var isNumber = function(value) {
		return !isNaN(parseInt(value, 10));
	};

	var plugins = HUI.widgets.Resize.prototype.plugins;

	plugins.alsoResize = {
		start: function () {
			var self = this, o = self.options;

			var _store = function (exp) {
				$(exp).each(function() {
					var el = $(this);
					el.data("resizable-alsoresize", {
						width: parseInt(el.width(), 10), height: parseInt(el.height(), 10),
						left: parseInt(el.css('left'), 10), top: parseInt(el.css('top'), 10)
					});
				});
			};

			if (typeof(o.alsoResize) == 'object' && !o.alsoResize.parentNode) {
				if (o.alsoResize.length) { o.alsoResize = o.alsoResize[0]; _store(o.alsoResize); }
				else { $.each(o.alsoResize, function (exp) { _store(exp); }); }
			}else{
				_store(o.alsoResize);
			}

		},

		resize: function (event, ui) {
			var self = this, o = self.options, 
				os = self.original.size, op = self.original.position,
				cs = self.current.size, cp = self.current.position;

			var delta = {
				height: (cs.height - os.height) || 0, width: (cs.width - os.width) || 0,
				top: (cp.top - op.top) || 0, left: (cp.left - op.left) || 0
			},

			_alsoResize = function (exp, c) {
				$(exp).each(function() {
					var el = $(this), start = $(this).data("resizable-alsoresize"), style = {},
						css = c && c.length ? c : el.parents(self.element[0]).length ? ['width', 'height'] : ['width', 'height', 'top', 'left'];

					$.each(css, function (i, prop) {
						var sum = (start[prop]||0) + (delta[prop]||0);
						if (sum && sum >= 0)
							style[prop] = sum || null;
					});

					el.css(style);
				});
			};

			if (typeof(o.alsoResize) == 'object' && !o.alsoResize.nodeType) {
				$.each(o.alsoResize, function (exp, c) { _alsoResize(exp, c); });
			}else{
				_alsoResize(o.alsoResize);
			}

		},

		stop: function () {
			$(this.element).removeData("resizable-alsoresize");
		}
	}

})(jQuery);
/*global jQuery, HUI*/
/*  
 * HUI slider
 * Depends:
 *  hui.widget.core.js
 */
(function ($) {
    "use strict";
    var SLIDER = '<a class="hui-slider-slider" href="#"></a>',
        RANGE = '<div class="hui-slider-range"></div>';

    var Mouse = HUI.widgets.Mouse;
    Mouse.extend("Slider", {
        options: {
            /**
             * @name max
             * @type number
             * @default 100
             * @desc 设置slider元素滑动区域最大值
             */
            max: 100,
            /**
             * @name min
             * @type number
             * @default 0
             * @desc 设置slider元素滑动区域最小值
             */
            min: 0,
            /**
             * @name orientation
             * @type string
             * @default 'h'
             * @desc 设置slider元素滑动方向
             */
            orientation: "h",
            /**
             * @name step
             * @type number
             * @default 1
             * @desc 设置slider元素每单元滑动多少区域
             */
            step: 1,
            /**
             * @name value
             * @type number
             * @default 0
             * @desc 设置slider元素显示位置
             */
            value: 0,
            /**
             * 当开始拖拽滑块时触发
             * @event start
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
            start: null,
            /**
             * 当拖拽滑块过程中连续触发
             * @event slide
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
            slide: null,
            /**
             * 当拖拽停止时触发
             * @event stop
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
            stop: null,
            /**
             * 当值发生改变时触发
             * @event change
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
            change: null
        },

        _create: function () {

            this._createElements();
            this._mouseInit();
            this._refreshVal();
            this.status = {};
        },

        _createElements: function () {
            var o = this.options,
                orientation = o.orientation === 'v' ? 'v' : 'h';

            this.element.addClass('hui-slider hui-slider-' +
                o.orientation +
                ' hui-corner');
            this._createRange();
            this._createSlider();
        },

        _createRange: function () {
            this.range = $(RANGE).appendTo(this.element);
        },

        _createSlider: function () {
            var o = this.options;

            this.slider = $(SLIDER).appendTo(this.element);
            this.slider.bind({
                click: function (event) {
                    event.preventDefault();
                },
                mouseenter: function () {
                    if (!o.disabled) {
                        $(this).addClass("hui-hover");
                    }
                },
                mouseleave: function () {
                    if (!o.disabled) {
                        $(this).removeClass("hui-hover");
                    }
                }
            });
        },

        _mouseCapture: function (event) {
            var o = this.options,
                el = this.element,
                position;

            if (o.disabled || !this.slider)
                return false;

            this.status.size = {
                width: el.outerWidth(),
                height: el.outerHeight()
            };
            this.status.offset = el.offset();
            this.status.click = null;

            position = {
                x: event.pageX,
                y: event.pageY
            };

            return true;
        },

        _mouseStart: function (event) {

            this._isDragging = true;

            this._trigger("start", event);
            return true;
        },

        _mouseDrag: function (event) {
            var position = {
                    x: event.pageX,
                    y: event.pageY
                },
                val = this._getValFromMouse(position),
                allowed;

            if (this.value() !== val) {
                allowed = this._trigger("slide", event, {
                    value: val
                });
                if (allowed !== false) {
                    this.value(val);
                }
            }
        },

        _mouseStop: function (event) {
            this._isDragging = false;

            this._trigger("stop", event, {
                value: this.value()
            });
            this.status.click = null;

            return false;
        },

        _getValFromMouse: function (pos) {
            var o = this.options,
                s = this.status,
                pxTotal, pxSlider, percentage, valTotal, valSlider, alignedVal;

            if (o.orientation === "h") {
                pxTotal = s.size.width;
                pxSlider = pos.x - s.offset.left;
            }
            else {
                pxTotal = s.size.height;
                pxSlider = pos.y - s.offset.top;
            }


            percentage = pxSlider / pxTotal;
            percentage = percentage < 0 ? 0 : (percentage > 1 ? 1 : percentage);

            if (o.orientation === "v") {
                percentage = 1 - percentage;
            }

            valTotal = o.max - o.min;
            valSlider = o.min + percentage * valTotal;
            alignedVal = this._alignVal(valSlider);

            return alignedVal;
        },

        _alignVal: function (val) {
            var o = this.options,
                step = o.step,
                alignVal;

            if (val <= o.min) return o.min;
            if (val >= o.max) return o.max;

            alignVal = val - (val - o.min) % step;
            return parseFloat(alignVal.toFixed(5));

        },

        _destroy: function () {
            this.element.removeClass();
        },

        _refreshVal: function () {
            var o = this.options,
                min = o.min,
                max = o.max,
                val = this.value(),
                percent = (val - min) / (max - min) * 100,
                rangeTo = {},
                sliderTo = {};

            sliderTo[o.orientation === 'h' ? "left" : "bottom"] = percent + '%';
            rangeTo[o.orientation === 'h' ? "width" : "height"] = percent + '%';

            this.slider.css(sliderTo);
            this.range.css(rangeTo);
        },

        /**
        获取或设置当前slider的值
        @param {number} - Set value for slider
        @return {number} Get current value when slider has changed
        */
        value: function (newValue) {
            if (arguments.length) {
                this.options.value = this._alignVal(newValue);
                this._refreshVal();
                this._trigger("change", null, {
                    value: newValue
                });
                return;
            }

            var val = this.options.value;
            val = this._alignVal(val);

            return val;
        }
    });

})(jQuery);
/*global jQuery, window, HUI*/
/**
 * @dependencies：
 * jquery.1.8.3.js
 * jquery.qrcode.js
 */
(function($) {
    "use strict";

    var QRCODE_HTML = '<li class="hui-qrcode">' +
        '           <a class="hui-qrcode-trigger"></a>' +
        '            <div class="hui-qrcode-pop">' +
        '                <a href="javascript:" class="hui-qrcode-close" title="close">' +
        '                    <img src="http://i2.w.yun.hjfile.cn/doc/201404/69cad619917c4d6cbb728fd3d49c6111.png"' +
        '                        alt="" /></a>' +
        '                <div class="hui-qrcode-content"></div>' +
        '                <div class="hui-qrcode-title">m.hujiang.com</div>' +
        '                <div class="triangle_white"></div>' +
        '                <div class="triangle_border"></div>' +
        '            </div>' +
        '        </li>',

        GOTOP_HTML = '<li class="hui-gotop-btn"><a id="hui-gotop-btn" title="回到顶部"></a></li>';

    HUI.Widget.extend("Sidebar", {
        options: {
            /**
             * @name showQRCode
             * @desc 是否显示二维码
             * @type bool
             * @default true
             */
            showQRCode: true,
            /**
             * @name qrCodeContent
             * @desc 设置二维码的显示内容
             * @type string
             * @default true
             */
            qrCodeContent: window.location.href,
             /**
             * @name buttons
             * @desc 设置自定义的Buttons，默认只有两个button一个生成二维码，一个用于置顶
             * @type Array
             * @default []
             */
            buttons: [],
            /**
             * @name minTop
             * @desc 定义了置顶按钮显示出来的最小高度(只有大于最小高度才显示)
             * @type Array
             * @default []
             */
            minTop: 300,
            /**
             * @name animation
             * @desc 设置动画
             * @type string
             * @default true
             */
            animation: {
                duration: 200
            }
        },

        _create: function() {
            var self = this,
                o = this.options,
                btns = o.buttons.join(''),
                min = o.minTop;

            this.element
                .addClass('hui-sidebar')
                .prepend(btns);

            if (o.showQRCode) {
                this.$qr = $(QRCODE_HTML).appendTo(this.element);
                this._createQRCode();
            }

            this.$gotop = $(GOTOP_HTML).appendTo(this.element);

            self.$gotop.on("click", function() {
                self.gotop();
            });

            self.$buttons = this.element.find('>li').addClass('hui-sidebtn');

            HUI.$win.on("scroll" + self.ns, function () {
                var h = $(window).scrollTop();
                self.$gotop[h > min ? "fadeIn" : "fadeOut"]();
            });
        },

        _createQRCode: function(pop) {
            var self = this,
                o = self.options,
                isWebkit = 'WebkitAppearance' in document.documentElement.style,
                content = self.element.find('.hui-qrcode-content'),
                closeBtn = self.element.find('.hui-qrcode-close'),
                qrBtn = self.element.find('.hui-qrcode-trigger'),
                $pop = this.element.find('.hui-qrcode-pop');

            closeBtn.on("click", function() {
                self._hideQRCode($pop);
            });

            qrBtn.on("click", function() {
                if ($pop.is(":visible")) {
                    self._hideQRCode($pop);
                } else {
                    self._showQRcode($pop);
                }
            });

            $(content).qrcode({
                render: isWebkit ? 'canvas' : 'table',
                width: 150,
                height: 150,
                text: o.qrCodeContent
            });
            self._showQRcode(pop);
        },

        _showQRcode: function(pop) {
            $(pop).show();
        },

        _hideQRCode: function(pop) {
            $(pop).hide();
        },

        _destroy: function() {
            this.element.removeClass('hui-sidebar');
        },

        /**
        滚动到顶部
        @return {jQuery}
        */
        gotop: function() {
            var tran = this.options.animation,
                duration = (tran && tran.duration) || 200;
            $('body, html').animate({
                scrollTop: 0
            }, duration);
        }
    });

})(jQuery);
/*global jQuery, window, HUI*/

/**
 * dependancies: jQuery, jQuery.mousewheel.js, HUI.mouse
 */

(function($) {
	"use strict";

	var SCROLLBAR_VERTICAL =
		'<div class="hui-scrollbar-vertical">' +
		'	<div class="hui-scrollbar-dragger-container">' +
		'		<div class="hui-scrollbar-dragger" oncontextmenu="return false;">' +
		'			<div class="hui-scrollbar-dragger-bar"></div>' +
		'		</div>' +
		'		<div class="hui-scrollbar-dragger-rail"></div>' +
		'	</div>' +
		'</div>',

		CONTENT_WRAPPER = '<div class="hui-scroll-content-wrapper"></div>',

		WRAPPER = '<div class="hui-scroll-box"><div class="hui-scroll-content" style="position: relative; top: 0px; left: 0px;"></div></div>',

		Mouse = HUI.widgets.Mouse;

	Mouse.extend("Scrollbar", {

		options: {
			/**
			 * @name scrollAmount
			 * @type number
			 * @default 50
			 * @desc 设置滚轮单次滚动的长度(单位:pixel)
			 */
			scrollAmount: 50,
			/**
			 * 当开始拖拽滚动条触发。
			 * @event start
			 * @param {jQuery.Event} e
			 * @param {jQuery} data
			 */
			start: null,
			/**
			 * 当拖拽滚动条的过程中触发。
			 * @event scroll
			 * @param {jQuery.Event} e
			 * @param {jQuery} data
			 */
			scroll: null,
			/**
			 * 当拖拽滚动条结束时触发。
			 * @event stop
			 * @param {jQuery.Event} e
			 * @param {jQuery} data
			 */
			stop: null
		},

		_create: function() {
			var self = this;

			this._createMarkup();
			this._mouseInit();
			//bind moue wheel
			this.scroll.contentWrap.on('mousewheel', function(event) {
				event.preventDefault();
				if (self.scrolling) return false;

				if (self.ratio < 1) {
					self.scrolling = true;
					self._mouseScroll(event);
				}
			});
		},

		_mouseProxy: function() {
			return this.scrollbar.container;
		},

		_createMarkup: function() {
			var self = this;

			this.element.addClass('hui-scrollbar')
				.wrapInner(WRAPPER)
				.find('.hui-scroll-box')
				.append(SCROLLBAR_VERTICAL);

			this.element.find('.hui-scroll-content').wrap(CONTENT_WRAPPER);

			this.scroll = {
				box: this.element.find('.hui-scroll-box'),
				content: this.element.find('.hui-scroll-content'),
				contentWrap: this.element.find('.hui-scroll-content-wrapper')
			};

			this.scrollbar = {
				container: this.element.find('.hui-scrollbar-dragger-container'),
				dragger: this.element.find('.hui-scrollbar-dragger')
			};

			this._setDraggerHeight();
		},

		_setDraggerHeight: function() {
			var s = this.scroll,
				bar = this.scrollbar,
				ratio = s.box.height() / s.content.height(),
				height = Math.round(ratio * bar.container.height());

			bar.dragger.css('height', height);

			this.draggerMaxTop = bar.container.height() - height;
			this.contentMinTop = this.scroll.contentWrap.height() - this.scroll.content.height();
			this.ratio = ratio;

			bar.container[ratio >= 1 ? 'hide' : 'show']();
		},

		_initDrag: function() {
			this.draggerTop = parseFloat(this.scrollbar.dragger.css('top'));
			this.contentTop = parseFloat(this.scroll.content.css('top'));
		},

		_mouseStart: function(event) {
			this._isDragging = true;
			this.original = {
				pageX: event.pageX,
				pageY: event.pageY
			};

			this._initDrag();
			this._trigger('start');
			return true;
		},

		_mouseDrag: function(event) {
			var top = this.draggerTop + (event.pageY - this.original.pageY), cTop;

			top = top < 0 ? 0 : (top > this.draggerMaxTop ? this.draggerMaxTop : top);			
			cTop = -top / this.ratio;
			
			this._handleScroll(top, cTop);		
		},

		_mouseStop: function(event) {
			this._isDragging = false;
			this._trigger('stop');
		},

		_mouseCapture: function(event) {
			return !!$(event.target).closest('.hui-scrollbar-dragger').length;
		},

		_handleScroll: function(dTop, cTop) {
			this._scrollToTop(dTop, cTop);
			this.scrolling = false;

			if(cTop !== this.originContentTop) {
				this._trigger('scroll', null, {
					contentTop: cTop
				});
			}

			this.originContentTop = cTop;
		},

		_mouseScroll: function(event) {
			this._initDrag();
			var cTop = parseFloat(this.scroll.content.css('top')) + event.deltaY * this.options.scrollAmount,
				dTop, toBottom = cTop < this.contentMinTop;

			cTop = toBottom ? this.contentMinTop : (cTop > 0 ? 0 : cTop);
			dTop = -cTop * this.ratio;

			this._handleScroll(dTop, cTop);			
		},

		_scrollToTop: function(dTop, cTop) {
			this.scrollbar.dragger.css({ 'top': dTop });
			this.scroll.content.css({ 'top': cTop });
		},
		
		/**
		刷新当前scrollbar位置及长度.
		@param {bool} toTop 刷新后是否指定
		@returns {jQuery} 
		*/
		refresh: function(toTop) {
			this._setDraggerHeight();
			if (toTop) {
				this._scrollToTop(0, 0);
			} else {
				this._resetDragger();
			}
		},

		_resetDragger: function() {
			var cTop = parseFloat(this.scroll.content.css('top')),
				dTop = -cTop * this.ratio;
			
			this.scrollbar.dragger.css('top', dTop);
		}
	});

})(jQuery);
/*global jQuery, HUI*/

(function ($) {
	"use strict";
	var DEFAULT_POS = {
		target: {
			coordinate: $('body'),
			width: 200,
			height: 300
		},
		offset: {
			left: 0,
			top: 0
		},
		fixed: false
	};

	var MASK_HTML = '<div class="hui-userguide-mask">' +
		'    <div class="hui-top-mask"></div>' +
		'    <div class="hui-right-mask"></div>' +
		'    <div class="hui-left-mask"></div>' +
		'    <div class="hui-bottom-mask"></div>' +
		'    <img class="hui-transparent-mask" src="about:blank" />' +
		'</div>';

	HUI.Widget.extend("UserGuide", {
		options: {
			/**
			 * @name showMask
			 * @type boolean
			 * @default true
			 * @desc 是否显示蒙版
			 */
			showMask: true,
			/**
			 * @name maskColor
			 * @type string|color
			 * @default #000
			 * @desc 蒙版颜色
			 */
			maskColor: '#000',
			/**
			 * @name currentStep
			 * @type number
			 * @default 0
			 * @desc 当前是第几步/从第几步开始
			 */
			currentStep: 0,
			/**
			 * @name type
			 * @type number
			 * @default 1000
			 * @desc 页面展示宽度，如果低于这个值，会出现滚定条
			 */
			minWidth: 1000,
			/**
			 * @name type
			 * @type boolean
			 * @default true
			 * @desc 自动滚动到展示引导的地方
			 */
			scrollToView: true,
			/**
			 * @name stepPos
			 * @type Array
			 * @default []
			 * @desc 设置每一步的相关数据, 包括位置信息等
			 */
			stepPos: [],
			/**
             * 关闭每一步引导的时候执行的函数
             * @event close
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
			close: null,
			/**
             * 当前步数发生变化时触发
             * @event stepChange
             * @param {jQuery.Event} e
             * @param {jQuery} data
             */
			stepChange: null
		},

		_create: function () {

			var o = this.options;
			this.contentHeight = Math.max(HUI.$win.height(), $('html').height(), $('body').height());			
			
			this.$steps = this.element
				.addClass('hui-userguide')
				.find('>div')
				.addClass('hui-step');
			this.totalSteps = this.$steps.length;

			if (o.showMask) {
				this._createMask();
			}

			this._bindEvent();
			this.show(o.currentStep);
		},

		_bindEvent: function () {
			var self = this,
				o = self.options;

			this.element.find('.hui-next-step').on('click', function (event) {

				self.element.find('.hui-step').hide();
				o.currentStep++;
				if (o.currentStep >= self.totalSteps) {
					o.currentStep = 1;
					self._hide();
				}
				else {
					self.show(o.currentStep);
				}

				self._trigger('stepChange', null, o.currentStep);
			});

			this.element.find('.hui-close-btn').on('click', function () {
				self._hide();
				self._trigger('close', null, o.currentStep);
			});
		},

		_getPos: function (step) {
			$(window).scrollTop(0);
			var item = this.options.stepPos[step];

			item = item || DEFAULT_POS;
			if (item.target.coordinate && item.target.coordinate.jquery) {
				return {
					pos: item.target,
					offset: item.offset || DEFAULT_POS.offset,
					fixed: item.fixed ? item.fixed : false
				};
			}
			else if (!isNaN(item.target.top)) {
				return item;
			}

		},
		/**
		 * 显示当前的步数
		 * @param  {number} step 当前的步数
		 * @return {void}
		 */
		show: function (step) {
			this.$steps.hide();
			this.options.currentStep = step;
			/* Show specified step of mask-guide.
			 * @param step
			 */
			this.element.css({
				width: '100%',
				height: this.contentHeight
			});

			var $curStep = this.$steps.eq(step),
				posInfo = this._getPos(step);

			var offset = posInfo.offset,
				pos = {
					top: posInfo.pos.coordinate.offset().top + (posInfo.pos.top ? posInfo.pos.top : 0),
					left: posInfo.pos.coordinate.offset().left + (posInfo.pos.left ? posInfo.pos.left : 0),
					width: posInfo.pos.width ? posInfo.pos.width : posInfo.pos.coordinate.width() + (posInfo.pos.left ? Math.abs(posInfo.pos.left) : 0),
					height: posInfo.pos.height ? posInfo.pos.height : posInfo.pos.coordinate.height() + (posInfo.pos.top ? Math.abs(posInfo.pos.top) : 0)
				},
				image = posInfo.pos.image;


			if (!isNaN(offset.top)) {
				$curStep.css('top', pos.top + offset.top);
			}

			if (!isNaN(offset.left)) {
				$curStep.css('left', pos.left - $curStep.width() + offset.left);
			}

			if (!isNaN(offset.right)) {
				$curStep.css('right', pos.left + pos.width + offset.right);
			}

			if (!isNaN(offset.bottom)) {
				$curStep.css('bottom', pos.top + pos.height + offset.bottom);
			}

			if (posInfo.fixed) {
				$curStep.css('position', 'fixed');
			}

			$curStep.show();
			if (this.options.showMask) {
				this._refreshMask(pos, posInfo.fixed, image);
			}

			if (this.options.scrollToView) {
				this._scrollToView(pos);
			}

		},

		_hide: function () {
			var self = this;
			this.element.find('.hui-step').hide();
			if (!this.options.showMask) return;

			this.mask.$sliceMask.fadeOut(function () {
				self.element.css({
					width: 0,
					height: 0
				});
			});
		},

		_createMask: function () {
			var $sliceMask = this.element.find('.hui-userguide-mask');

			if ($sliceMask.length === 0) {
				$sliceMask = $(MASK_HTML);
				this.element.append($sliceMask);
			}

			this.mask = {
				$sliceMask: $sliceMask,
				$bottomMask: $sliceMask.find('>.hui-bottom-mask'),
				$topMask: $sliceMask.find('>.hui-top-mask'),
				$leftMask: $sliceMask.find('>.hui-left-mask'),
				$rightMask: $sliceMask.find('>.hui-right-mask'),
				$image: $sliceMask.find('>img')
			};

			$sliceMask.find('>div').css('background-color', this.options.maskColor);
		},

		_refreshMask: function (info, fixed, img) {
			var width = HUI.$win.width() <= this.options.minWidth ? this.options.minWidth : HUI.$win.width(),
				_mask = this.mask;

			_mask.$topMask.css({
				left: 0,
				top: 0,
				width: info.left + info.width,
				height: info.top
			});

			_mask.$leftMask.css({
				top: info.top,
				left: 0,
				width: info.left,
				height: this.contentHeight - info.top
			});

			_mask.$bottomMask.css({
				top: info.top + info.height,
				left: info.left,
				width: width - info.left,
				height: this.contentHeight - info.height - info.top
			});

			_mask.$rightMask.css({
				top: 0,
				left: info.left + info.width,
				width: width - info.left - info.width,
				height: info.height + info.top
			});

			if (img) {
				_mask.$image.css({
					left: info.left,
					top: info.top,
					width: info.width,
					height: info.height
				});
				_mask.$image.attr('src', img).show();
			}
			else {
				_mask.$image.hide();
			}

			if (fixed) {
				_mask.$sliceMask.find('>div').css('position', 'fixed');
			}
			else {
				_mask.$sliceMask.find('>div').css('position', 'absolute');
				_mask.$image.css('position', 'absolute');
			}

			_mask.$sliceMask.fadeIn();
		},

		_scrollToView: function (pos) {
			var top = pos.top - ($(window).height() - pos.height) / 2;
			$(window).scrollTop(top);
		}

	});
})(jQuery);
/*global jQuery, HUI*/
(function($) {
	"use strict";

	HUI.Widget.extend("Tabs", {
		
		options: {
			/**
             * @name direction
             * @type string
             * @default "horizontal"
             * @desc 设置Tabs是水平方向还是垂直方向
             */
			direction: "horizontal"
		},

		_create: function() {
			var tabClass = this.options.direction === "vertical" ?  "hui-tabs hui-tabs-vertical" : "hui-tabs";
			this.element.addClass(tabClass);
			this._renderTabs();
			this._renderPanels();
			this.setActiveTab();
			this._bindEvents();
		},

		_renderTabs: function() {
			this.tablist = this._getList()
				.addClass("hui-tabs-nav");

			this.tabs = this.tablist.find("> li:has(a[href])")
				.addClass("hui-tabs-item");

			this._hashToAttr();
		},

		_renderPanels: function() {
			var self = this;

			self.panels = $();

			self.tabs.each(function(i) {
				var $this = $(this),
					panelId = $this.attr("data-panel"),
					panel = self.element.find("#" + panelId);

				if (!panel.length) {
					panel = self._createPanel(panelId);
					panel.insertAfter(self.panels[i - 1] || self.tablist);
				}

				if (panel.length) {
					self.panels = self.panels.add(panel);
				}
			});

			self.panels.addClass("hui-tabs-panel");
		},

		/**
		 * 设置当前的激活Tab
		 * @param {number} idx 当前激活标签的位置
		 * @returns {jQuery}
		 */
		setActiveTab: function(idx) {
			var i = idx || 0,
				$this = this.tabs.eq(i),
				panelId = $this.attr("data-panel"),
				$panel = this.element.find("#" + panelId);

			this.tabs.removeClass("hui-tabs-active");
			this.panels.hide();
			!$this.hasClass("hui-tabs-active") && $this.addClass("hui-tabs-active") && $panel.show();
		},

		_createPanel: function(id) {
			return $("<div>")
				.attr("id", id)
				.addClass("hui-tabs-panel");
		},

		_bindEvents: function() {
			var self = this;

			self.tablist.delegate(">li", {
				click: function(event) {
					self.setActiveTab($(this).index());
				}
			});

			self.tabs.delegate("a", {
				click: function(event) {
					event.preventDefault();
				}
			});
		},

		_hashToAttr: function() {
			var self = this;

			self.tabs.each(function() {
				var $this = $(this),
					anchor = $this.find("a[href]"),
					anchorHash = self._sanitizeSelector(anchor[0].hash.replace("#", ""));

				$this.attr({
					"data-panel": anchorHash
				});
			});
		},

		_sanitizeSelector: function(hash) {
			return hash ? hash.replace(/[!"$%&'()*+,.\/:;<=>?@\[\]\^`{|}~]/g, "\\$&") : "";
		},

		_getList: function() {
			return this.tabList || this.element.find("ol,ul");
		},

		_getPanel: function(tab) {
			var panelId = $(tab).attr("data-panel");
			return this.element.find(panelId);
		}
	});

})(jQuery);
(function($) {
	/*******************
	 * most of implement is copied from $.ui.position
	 * It's solid, fast utility-module;
	 ********************/
	window.HUI = window.HUI || {};

	var cachedScrollbarWidth, supportsOffsetFractions,
		max = Math.max,
		abs = Math.abs,
		round = Math.round,
		rhorizontal = /left|center|right/,
		rvertical = /top|center|bottom/,
		roffset = /[\+\-]\d+(\.[\d]+)?%?/,
		rposition = /^\w+/,
		rpercent = /%$/,
		_position = $.fn.position;

	function getOffsets(offsets, width, height) {
		return [
			parseFloat(offsets[0]) * (rpercent.test(offsets[0]) ? width / 100 : 1),
			parseFloat(offsets[1]) * (rpercent.test(offsets[1]) ? height / 100 : 1)
		];
	}

	function parseCss(element, property) {
		return parseInt($.css(element, property), 10) || 0;
	}

	function getDimensions(elem) {
		var raw = elem[0];
		if (raw.nodeType === 9) {
			return {
				width: elem.width(),
				height: elem.height(),
				offset: {
					top: 0,
					left: 0
				}
			};
		}
		if ($.isWindow(raw)) {
			return {
				width: elem.width(),
				height: elem.height(),
				offset: {
					top: elem.scrollTop(),
					left: elem.scrollLeft()
				}
			};
		}
		if (raw.preventDefault) {
			return {
				width: 0,
				height: 0,
				offset: {
					top: raw.pageY,
					left: raw.pageX
				}
			};
		}
		return {
			width: elem.outerWidth(),
			height: elem.outerHeight(),
			offset: elem.offset()
		};
	}

	$.position = {
		scrollbarWidth: function() {
			if (cachedScrollbarWidth !== undefined) {
				return cachedScrollbarWidth;
			}
			var w1, w2,
				div = $("<div style='display:block;position:absolute;width:50px;height:50px;overflow:hidden;'><div style='height:100px;width:auto;'></div></div>"),
				innerDiv = div.children()[0];

			$("body").append(div);
			w1 = innerDiv.offsetWidth;
			div.css("overflow", "scroll");

			w2 = innerDiv.offsetWidth;

			if (w1 === w2) {
				w2 = div[0].clientWidth;
			}

			div.remove();

			return (cachedScrollbarWidth = w1 - w2);
		},
		getScrollInfo: function(within) {
			var overflowX = within.isWindow || within.isDocument ? "" :
				within.element.css("overflow-x"),
				overflowY = within.isWindow || within.isDocument ? "" :
				within.element.css("overflow-y"),
				hasOverflowX = overflowX === "scroll" ||
				(overflowX === "auto" && within.width < within.element[0].scrollWidth),
				hasOverflowY = overflowY === "scroll" ||
				(overflowY === "auto" && within.height < within.element[0].scrollHeight);
			return {
				width: hasOverflowY ? $.position.scrollbarWidth() : 0,
				height: hasOverflowX ? $.position.scrollbarWidth() : 0
			};
		},
		getWithinInfo: function(element) {
			var withinElement = $(element || window),
				isWindow = $.isWindow(withinElement[0]),
				isDocument = !!withinElement[0] && withinElement[0].nodeType === 9;
			return {
				element: withinElement,
				isWindow: isWindow,
				isDocument: isDocument,
				offset: withinElement.offset() || {
					left: 0,
					top: 0
				},
				scrollLeft: withinElement.scrollLeft(),
				scrollTop: withinElement.scrollTop(),

				// support: jQuery 1.6.x
				// jQuery 1.6 doesn't support .outerWidth/Height() on documents or windows
				width: isWindow || isDocument ? withinElement.width() : withinElement.outerWidth(),
				height: isWindow || isDocument ? withinElement.height() : withinElement.outerHeight()
			};
		}
	};

	/**
    设置该元素相对于指定元素的位置
    @param {number} - options 配置信息
    */
	$.fn.position = function(options) {
		if (!options || !options.of) {
			return _position.apply(this, arguments);
		}

		// make a copy, we don't want to modify arguments
		options = $.extend({}, options);

		var atOffset, targetWidth, targetHeight, targetOffset, basePosition, dimensions,
			target = $(options.of),
			within = $.position.getWithinInfo(options.within),
			scrollInfo = $.position.getScrollInfo(within),
			collision = (options.collision || "flip").split(" "),
			offsets = {};

		dimensions = getDimensions(target);
		if (target[0].preventDefault) {
			// force left top to allow flipping
			options.at = "left top";
		}
		targetWidth = dimensions.width;
		targetHeight = dimensions.height;
		targetOffset = dimensions.offset;
		// clone to reuse original targetOffset later
		basePosition = $.extend({}, targetOffset);

		// force my and at to have valid horizontal and vertical positions
		// if a value is missing or invalid, it will be converted to center
		$.each(["my", "at"], function() {
			var pos = (options[this] || "").split(" "),
				horizontalOffset,
				verticalOffset;

			if (pos.length === 1) {
				pos = rhorizontal.test(pos[0]) ?
					pos.concat(["center"]) :
					rvertical.test(pos[0]) ?
					["center"].concat(pos) :
					["center", "center"];
			}
			pos[0] = rhorizontal.test(pos[0]) ? pos[0] : "center";
			pos[1] = rvertical.test(pos[1]) ? pos[1] : "center";

			// calculate offsets
			horizontalOffset = roffset.exec(pos[0]);
			verticalOffset = roffset.exec(pos[1]);
			offsets[this] = [
				horizontalOffset ? horizontalOffset[0] : 0,
				verticalOffset ? verticalOffset[0] : 0
			];

			// reduce to just the positions without the offsets
			options[this] = [
				rposition.exec(pos[0])[0],
				rposition.exec(pos[1])[0]
			];
		});

		// normalize collision option
		if (collision.length === 1) {
			collision[1] = collision[0];
		}

		if (options.at[0] === "right") {
			basePosition.left += targetWidth;
		} else if (options.at[0] === "center") {
			basePosition.left += targetWidth / 2;
		}

		if (options.at[1] === "bottom") {
			basePosition.top += targetHeight;
		} else if (options.at[1] === "center") {
			basePosition.top += targetHeight / 2;
		}

		atOffset = getOffsets(offsets.at, targetWidth, targetHeight);
		basePosition.left += atOffset[0];
		basePosition.top += atOffset[1];

		return this.each(function() {
			var collisionPosition, using,
				elem = $(this),
				elemWidth = elem.outerWidth(),
				elemHeight = elem.outerHeight(),
				marginLeft = parseCss(this, "marginLeft"),
				marginTop = parseCss(this, "marginTop"),
				collisionWidth = elemWidth + marginLeft + parseCss(this, "marginRight") + scrollInfo.width,
				collisionHeight = elemHeight + marginTop + parseCss(this, "marginBottom") + scrollInfo.height,
				position = $.extend({}, basePosition),
				myOffset = getOffsets(offsets.my, elem.outerWidth(), elem.outerHeight());

			if (options.my[0] === "right") {
				position.left -= elemWidth;
			} else if (options.my[0] === "center") {
				position.left -= elemWidth / 2;
			}

			if (options.my[1] === "bottom") {
				position.top -= elemHeight;
			} else if (options.my[1] === "center") {
				position.top -= elemHeight / 2;
			}

			position.left += myOffset[0];
			position.top += myOffset[1];

			// if the browser doesn't support fractions, then round for consistent results
			if (!supportsOffsetFractions) {
				position.left = round(position.left);
				position.top = round(position.top);
			}

			collisionPosition = {
				marginLeft: marginLeft,
				marginTop: marginTop
			};

			$.each(["left", "top"], function(i, dir) {
				if (HUI.position[collision[i]]) {
					HUI.position[collision[i]][dir](position, {
						targetWidth: targetWidth,
						targetHeight: targetHeight,
						elemWidth: elemWidth,
						elemHeight: elemHeight,
						collisionPosition: collisionPosition,
						collisionWidth: collisionWidth,
						collisionHeight: collisionHeight,
						offset: [atOffset[0] + myOffset[0], atOffset[1] + myOffset[1]],
						my: options.my,
						at: options.at,
						within: within,
						elem: elem
					});
				}
			});

			if (options.using) {
				// adds feedback as second argument to using callback, if present
				using = function(props) {
					var left = targetOffset.left - position.left,
						right = left + targetWidth - elemWidth,
						top = targetOffset.top - position.top,
						bottom = top + targetHeight - elemHeight,
						feedback = {
							target: {
								element: target,
								left: targetOffset.left,
								top: targetOffset.top,
								width: targetWidth,
								height: targetHeight
							},
							element: {
								element: elem,
								left: position.left,
								top: position.top,
								width: elemWidth,
								height: elemHeight
							},
							horizontal: right < 0 ? "left" : left > 0 ? "right" : "center",
							vertical: bottom < 0 ? "top" : top > 0 ? "bottom" : "middle"
						};
					if (targetWidth < elemWidth && abs(left + right) < targetWidth) {
						feedback.horizontal = "center";
					}
					if (targetHeight < elemHeight && abs(top + bottom) < targetHeight) {
						feedback.vertical = "middle";
					}
					if (max(abs(left), abs(right)) > max(abs(top), abs(bottom))) {
						feedback.important = "horizontal";
					} else {
						feedback.important = "vertical";
					}
					options.using.call(this, props, feedback);
				};
			}

			elem.offset($.extend(position, {
				using: using
			}));
		});
	};

	HUI.position = {
		fit: {
			left: function(position, data) {
				var within = data.within,
					withinOffset = within.isWindow ? within.scrollLeft : within.offset.left,
					outerWidth = within.width,
					collisionPosLeft = position.left - data.collisionPosition.marginLeft,
					overLeft = withinOffset - collisionPosLeft,
					overRight = collisionPosLeft + data.collisionWidth - outerWidth - withinOffset,
					newOverRight;

				// element is wider than within
				if (data.collisionWidth > outerWidth) {
					// element is initially over the left side of within
					if (overLeft > 0 && overRight <= 0) {
						newOverRight = position.left + overLeft + data.collisionWidth - outerWidth - withinOffset;
						position.left += overLeft - newOverRight;
						// element is initially over right side of within
					} else if (overRight > 0 && overLeft <= 0) {
						position.left = withinOffset;
						// element is initially over both left and right sides of within
					} else {
						if (overLeft > overRight) {
							position.left = withinOffset + outerWidth - data.collisionWidth;
						} else {
							position.left = withinOffset;
						}
					}
					// too far left -> align with left edge
				} else if (overLeft > 0) {
					position.left += overLeft;
					// too far right -> align with right edge
				} else if (overRight > 0) {
					position.left -= overRight;
					// adjust based on position and margin
				} else {
					position.left = max(position.left - collisionPosLeft, position.left);
				}
			},
			top: function(position, data) {
				var within = data.within,
					withinOffset = within.isWindow ? within.scrollTop : within.offset.top,
					outerHeight = data.within.height,
					collisionPosTop = position.top - data.collisionPosition.marginTop,
					overTop = withinOffset - collisionPosTop,
					overBottom = collisionPosTop + data.collisionHeight - outerHeight - withinOffset,
					newOverBottom;

				// element is taller than within
				if (data.collisionHeight > outerHeight) {
					// element is initially over the top of within
					if (overTop > 0 && overBottom <= 0) {
						newOverBottom = position.top + overTop + data.collisionHeight - outerHeight - withinOffset;
						position.top += overTop - newOverBottom;
						// element is initially over bottom of within
					} else if (overBottom > 0 && overTop <= 0) {
						position.top = withinOffset;
						// element is initially over both top and bottom of within
					} else {
						if (overTop > overBottom) {
							position.top = withinOffset + outerHeight - data.collisionHeight;
						} else {
							position.top = withinOffset;
						}
					}
					// too far up -> align with top
				} else if (overTop > 0) {
					position.top += overTop;
					// too far down -> align with bottom edge
				} else if (overBottom > 0) {
					position.top -= overBottom;
					// adjust based on position and margin
				} else {
					position.top = max(position.top - collisionPosTop, position.top);
				}
			}
		},
		flip: {
			left: function(position, data) {
				var within = data.within,
					withinOffset = within.offset.left + within.scrollLeft,
					outerWidth = within.width,
					offsetLeft = within.isWindow ? within.scrollLeft : within.offset.left,
					collisionPosLeft = position.left - data.collisionPosition.marginLeft,
					overLeft = collisionPosLeft - offsetLeft,
					overRight = collisionPosLeft + data.collisionWidth - outerWidth - offsetLeft,
					myOffset = data.my[0] === "left" ?
					-data.elemWidth :
					data.my[0] === "right" ?
					data.elemWidth :
					0,
					atOffset = data.at[0] === "left" ?
					data.targetWidth :
					data.at[0] === "right" ?
					-data.targetWidth :
					0,
					offset = -2 * data.offset[0],
					newOverRight,
					newOverLeft;

				if (overLeft < 0) {
					newOverRight = position.left + myOffset + atOffset + offset + data.collisionWidth - outerWidth - withinOffset;
					if (newOverRight < 0 || newOverRight < abs(overLeft)) {
						position.left += myOffset + atOffset + offset;
					}
				} else if (overRight > 0) {
					newOverLeft = position.left - data.collisionPosition.marginLeft + myOffset + atOffset + offset - offsetLeft;
					if (newOverLeft > 0 || abs(newOverLeft) < overRight) {
						position.left += myOffset + atOffset + offset;
					}
				}
			},
			top: function(position, data) {
				var within = data.within,
					withinOffset = within.offset.top + within.scrollTop,
					outerHeight = within.height,
					offsetTop = within.isWindow ? within.scrollTop : within.offset.top,
					collisionPosTop = position.top - data.collisionPosition.marginTop,
					overTop = collisionPosTop - offsetTop,
					overBottom = collisionPosTop + data.collisionHeight - outerHeight - offsetTop,
					top = data.my[1] === "top",
					myOffset = top ?
					-data.elemHeight :
					data.my[1] === "bottom" ?
					data.elemHeight :
					0,
					atOffset = data.at[1] === "top" ?
					data.targetHeight :
					data.at[1] === "bottom" ?
					-data.targetHeight :
					0,
					offset = -2 * data.offset[1],
					newOverTop,
					newOverBottom;
				if (overTop < 0) {
					newOverBottom = position.top + myOffset + atOffset + offset + data.collisionHeight - outerHeight - withinOffset;
					if ((position.top + myOffset + atOffset + offset) > overTop && (newOverBottom < 0 || newOverBottom < abs(overTop))) {
						position.top += myOffset + atOffset + offset;
					}
				} else if (overBottom > 0) {
					newOverTop = position.top - data.collisionPosition.marginTop + myOffset + atOffset + offset - offsetTop;
					if ((position.top + myOffset + atOffset + offset) > overBottom && (newOverTop > 0 || abs(newOverTop) < overBottom)) {
						position.top += myOffset + atOffset + offset;
					}
				}
			}
		},
		flipfit: {
			left: function() {
				HUI.position.flip.left.apply(this, arguments);
				HUI.position.fit.left.apply(this, arguments);
			},
			top: function() {
				HUI.position.flip.top.apply(this, arguments);
				HUI.position.fit.top.apply(this, arguments);
			}
		}
	};
	// fraction support test
	(function() {
		var testElement, testElementParent, testElementStyle, offsetLeft, i,
			body = document.getElementsByTagName("body")[0],
			div = document.createElement("div");

		//Create a "fake body" for testing based on method used in jQuery.support
		testElement = document.createElement(body ? "div" : "body");
		testElementStyle = {
			visibility: "hidden",
			width: 0,
			height: 0,
			border: 0,
			margin: 0,
			background: "none"
		};
		if (body) {
			$.extend(testElementStyle, {
				position: "absolute",
				left: "-1000px",
				top: "-1000px"
			});
		}
		for (i in testElementStyle) {
			testElement.style[i] = testElementStyle[i];
		}
		testElement.appendChild(div);
		testElementParent = body || document.documentElement;
		testElementParent.insertBefore(testElement, testElementParent.firstChild);

		div.style.cssText = "position: absolute; left: 10.7432222px;";

		offsetLeft = $(div).offset().left;
		supportsOffsetFractions = offsetLeft > 10 && offsetLeft < 11;

		testElement.innerHTML = "";
		testElementParent.removeChild(testElement);
	})();

})(jQuery);

/*global jQuery, window, HUI*/


(function($) {
    "use strict";


    /**
     * This widget takes a div element and makes it classic
     * @require HUI.widget.core
     * @example
     *      $('<div/>').huiProgressbar({value: 20});
     */
    HUI.define(["hui.widget.core"], function() {

        var CONTENT_HTML = '<div class="hui-progressbar-value hui-progressbar-round-corner" style="width:0%"></div>';

        HUI.Widget.extend("Progressbar", {
            options: {
                /**
                 * @name value                  
                 * @type number               
                 * @default 0
                 * @desc 设置进度条的初始值
                 */
                value: 0,
                /**
                 * @name animation                 
                 * @type Object           
                 * @default {
                 *      duration: 1500,
                 *      easing: 'linear'
                 * }
                 * @desc 设置动画的间隔时间
                 */
                animation:{
                     /**
                     * @name width                 
                     * @type number           
                     * @default 1500
                     * @desc 设置动画的间隔时间
                     */
                    duration: 1500,
                    /**
                     * @name easing                               
                     * @type string           
                     * @default 'linear'
                     * @desc 设置动画的easing参数
                     */
                    easing: 'linear'
                },
                /**
                 * @name max                              
                 * @type number           
                 * @default 100
                 * @desc 设置进度条的最大值
                 */
                max: 100,
                /**
                 * @name color                              
                 * @type string           
                 * @default 100
                 * @desc 设置进度条的颜色
                 */
                color: '#74cd55',
                /**
                 * @name progressHTML                                          
                 * @type string           
                 * @default '<div class="hui-progressbar-value hui-progressbar-round-corner" style="width:0%"></div>'
                 * @desc 设置进度条内部进度的HTML模板
                 */
                progressHTML: CONTENT_HTML,
                /**
                 * 当进度条进度完成时触发
                 * @event complete
                 * @param {jQuery.Event} e
                 * @param {jQuery} data
                 */
                complete: null,
                /**
                 * 在进度条进度滚动时触发(连续触发事件)。
                 * @event progress
                 * @param {jQuery.Event} e
                 * @param {jQuery} data
                 */
                progress: null
            },

            _setOption: function(key, value) {
                if (key === "value") {
                    return this.value(value);
                }
            },

            _create: function() {
                this.element.addClass('hui-progressbar');
                this.valueDiv = $(this.options.progressHTML)
                    .css("background-color", this.options.color)
                    .appendTo(this.element);
                this._oldValue = 0;
                this._refreshValue();

            },

            /**
            获取或设置进度条的值
            @param {number} - Set value for progressbar
            @returns {number} Get current value if param not set.
            */
            value: function(val) {
                if (val === undefined) {
                    return this._getValue();
                }
                this._setValue(val);
                return this;
            },

            _destroy: function() {
                this.element
                    .removeClass('hui-progressbar');
                this.valueDiv.remove();
            },

            _getValue: function() {
                var val = this.options.value;
                if (typeof val !== 'number') {
                    val = 0;
                }
                return Math.min(this.options.max, val);
            },

            _setValue: function(val) {
                this.options.value = val;
                this._refreshValue();
            },

            _percentage: function() {
                return (100 * this._getValue() / this.options.max);
            },

            _percent2Val: function(percentage) {
                var val = (percentage * this.options.max / 100);
                return Math.min(this.options.value, val);
            },

            _refreshValue: function() {
                var self = this,
                    value = self._getValue(),
                    o = self.options,
                    percentage = self._percentage() + '%',
                    complete = function() {
                        self._oldValue = value;
                        self._trigger("complete", null, {
                            value: value
                        });
                    };

                if (self._oldValue === value) {
                    complete();
                    return;
                }

                self.valueDiv.animate({
                    width: percentage
                }, {
                    easing: o.animation.easing,
                    duration: o.animation.duration,
                    complete: complete,
                    step: function(step) {
                        self._trigger("progress", null, {
                            value : self._percent2Val(step)
                        });
                    }
                });
            }
        });
    });

})(jQuery);