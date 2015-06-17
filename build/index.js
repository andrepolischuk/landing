(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _land = require('land');

var _land2 = _interopRequireDefault(_land);

(0, _land2['default'])('.section-opacity').children('h2').opacity(0);

(0, _land2['default'])('.section-x').children('h2').x(-400);

(0, _land2['default'])('.section-y').children('h2').y(-400);

(0, _land2['default'])('.section-rotate').children('h2').rotate(180);

(0, _land2['default'])('.section-scale').children('h2').scale(0.5);

(0, _land2['default'])('.section-all').children('h2').x(-400).y(-400).opacity(0).rotate(90).scale(0.5);

},{"land":2}],2:[function(require,module,exports){

'use strict';

/**
 * Module dependencies
 */

try {
  var type = require('type');
} catch (err) {
  var type = require('component-type');
}

var each = require('ea');

/**
 * Current section
 */

var current;

/**
 * Current scrollTop
 */

var scrollTop;

/**
 * Transform parameters
 */

var transforms = {
  x: {
    prop: 'transform',
    def: 0,
    ext: 'px',
    func: 'translateX'
  },
  y: {
    prop: 'transform',
    def: 0,
    ext: 'px',
    func: 'translateY'
  },
  scale: {
    prop: 'transform',
    def: 1,
    func: 'scale'
  },
  rotate: {
    prop: 'transform',
    def: 0,
    ext: 'deg',
    func: 'rotate'
  },
  opacity: {
    def: 1,
    prop: 'opacity'
  }
};

/**
 * CSS prefixes for transform parameters
 */

var prefix = {
  transform: [
    'webkitTransform',
    'MozTransform',
    'msTransform',
    'oTransform',
    'transform'
  ],
  opacity: [
    'MozOpacity',
    'opacity'
  ]
};

/**
 * Callbacks
 */

var callbacks = {};

/**
 * Expose land
 */

module.exports = Section;

/**
 * Section
 *
 * @param {String|Element} el
 * @api public
 */

function Section(el) {
  if (!(this instanceof Section)) return new Section(el);
  if (type(el) === 'string') el = document.querySelector(el);
  if (!el) return;

  this.element = el;
  this.childrens = [];
  this.current = false;
  this._progress = 0;

  Section.sections.push(this);
}

/**
 * Create section children
 *
 * @param  {String|Element} el
 * @return {Object}
 * @api public
 */

Section.prototype.children = function(el) {
  return new Children(el, this);
};

/**
 * Update section
 *
 * @api public
 */

Section.prototype.update = function() {
  var height = this.element.offsetHeight;
  var scrollBottom = scrollTop + window.innerHeight;
  var offsetTop = this.element.offsetTop;

  this.current = scrollBottom >= offsetTop &&
  scrollBottom <= offsetTop + height;

  this._progress = scrollBottom <= offsetTop ? 0 :
    (scrollBottom >= offsetTop + height ? 1 :
    (scrollBottom - offsetTop) / height);

  each(this.childrens, function(children) {
    children.update();
  });
};

/**
 * Section children
 *
 * @param {String|Element} el
 * @api public
 */

function Children(el, section) {
  if (type(el) === 'string') el = section.element.querySelector(el);
  if (!el) return;

  this.element = el;
  this.section = section;

  this._transform = {};
  this._delay = 0;

  section.childrens.push(this);
}

/**
 * Attach transform props
 *
 * @param {String} prop
 * @param {Number|Function} val
 * @api public
 */

Children.prototype.set = function(prop, val) {
  this._transform[prop] = type(val) === 'function' ?
    val : parseFloat(val);
  this.update();
  return this;
};

/**
 * Attach transform prop
 *
 * @param  {Number|Function} val
 * @return {Object}
 * @api public
 */

each(transforms, function(transform, prop) {
  Children.prototype[prop] = function(val) {
    this.set(prop, val);
    return this;
  };
});

/**
 * Attach delay
 *
 * @param  {Number} delay
 * @return {Object}
 * @api public
 */

Children.prototype.delay = function(delay) {
  this._delay = parseFloat(delay) || 0;
  return this;
};

/**
 * Create next children
 *
 * @param  {String|Element} el
 * @return {Object}
 * @api public
 */

Children.prototype.children = function(el) {
  return this.section.children(el);
};

/**
 * Update section children
 *
 * @api public
 */

Children.prototype.update = function() {
  var delay = this._delay;
  var progress = this.section._progress;
  var element = this.element;
  var css = {};

  each(this._transform, function(val, param) {
    var transform = transforms[param];
    var final = transform.def;

    var value = type(val) === 'function' ?
      val(progress, final) :
      val + ((final - val) * (progress < delay ? 0 :
        progress - 1 + ((progress - delay) / (1 - delay))));

    value += transform.ext || '';
    value = param === 'opacity' ? value : transform.func + '(' + value + ')';

    each(prefix[transform.prop], function(pref) {
      css[pref] = css[pref] ? css[pref] + ' ' + value : value;
    });
  });

  each(css, function(value, prop) {
    element.style[prop] = value;
  });
};

/**
 * Set callback
 *
 * @param {String} event
 * @param {Function} fn
 * @api public
 */

Section.on = function(event, fn) {
  if (type(fn) !== 'function') return;
  callbacks[event] = fn;
};

/**
 * Sections array
 *
 * @api public
 */

Section.sections = [];

/**
 * Initialize
 */

window.addEventListener('scroll', scroll, false);
scroll();

/**
 * Scroll handler
 *
 * @api private
 */

function scroll() {
  var cur = 0;
  scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  each(Section.sections, function(section, i) {
    section.update();
    cur = section.current ? i : cur;
  });

  if (cur === current) return;
  current = cur;

  if (callbacks.change) {
    callbacks.change(current);
  }
}

},{"component-type":3,"ea":4,"type":3}],3:[function(require,module,exports){
/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object Error]': return 'error';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val !== val) return 'nan';
  if (val && val.nodeType === 1) return 'element';

  val = val.valueOf
    ? val.valueOf()
    : Object.prototype.valueOf.apply(val)

  return typeof val;
};

},{}],4:[function(require,module,exports){

'use strict';

/**
 * Module dependencies
 */

try {
  var type = require('type');
} catch (err) {
  var type = require('component-type');
}

/**
 * Has own property
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Expose direct iterate
 */

module.exports = each;

/**
 * Expose reverse iterate
 *
 * @param {Object|Array} obj
 * @param {Function} fn
 * @return {Function}
 * @api public
 */

module.exports.reverse = function(obj, fn) {
  return each(obj, fn, 'reverse');
};

/**
 * Iteration router
 *
 * @param {Object|Array} obj
 * @param {Function} fn
 * @return {Function}
 * @api public
 */

function each(obj, fn, direction) {
  if (typeof fn === 'function') {
    switch (type(obj)) {
      case 'array':
        return (array[direction] || array)(obj, fn);
      case 'object':
        if (type(obj.length) === 'number') {
          return (array[direction] || array)(obj, fn);
        }
        return (object[direction] || object)(obj, fn);
      case 'string':
        return (string[direction] || string)(obj, fn);
    }
  }
}

/**
 * Iterate array
 *
 * @param {Array} obj
 * @param {Function} fn
 * @api private
 */

function array(obj, fn) {
  for (var i = 0; i < obj.length; i++) {
    fn(obj[i], i);
  }
}

/**
 * Iterate array in reverse order
 *
 * @param {Array} obj
 * @param {Function} fn
 * @api private
 */

array.reverse = function(obj, fn) {
  for (var i = obj.length - 1; i >= 0; i--) {
    fn(obj[i], i);
  }
};

/**
 * Iterate object
 *
 * @param {Object} obj
 * @param {Function} fn
 * @api private
 */

function object(obj, fn) {
  for (var i in obj) {
    if (has.call(obj, i)) {
      fn(obj[i], i);
    }
  }
}

/**
 * Iterate object in reverse order
 *
 * @param {Object} obj
 * @param {Function} fn
 * @api private
 */

object.reverse = function(obj, fn) {
  var keys = [];
  for (var k in obj) {
    if (has.call(obj, k)) {
      keys.push(k);
    }
  }
  for (var i = keys.length - 1; i >= 0; i--) {
    fn(obj[keys[i]], keys[i]);
  }
};

/**
 * Iterate string
 *
 * @param {Array} obj
 * @param {Function} fn
 * @api private
 */

function string(obj, fn) {
  for (var i = 0; i < obj.length; i++) {
    fn(obj.charAt(i), i);
  }
}

/**
 * Iterate string in reverse order
 *
 * @param {Array} obj
 * @param {Function} fn
 * @api private
 */

string.reverse = function(obj, fn) {
  for (var i = obj.length - 1; i >= 0; i--) {
    fn(obj.charAt(i), i);
  }
};

},{"component-type":3,"type":3}]},{},[1]);
