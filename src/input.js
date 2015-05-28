'use strict';

var $ = require('jquery');
var Base = require('nd-base');

var specialKeyCodeMap = {
  9: 'tab',
  27: 'esc',
  37: 'left',
  39: 'right',
  13: 'enter',
  38: 'up',
  40: 'down'
};

function wrapFn(fn, context) {
  return function() {
    fn.apply(context, arguments);
  };
}

function compare(a, b) {
  a = (a || '').replace(/^\s*/g, '').replace(/\s{2,}/g, ' ');
  b = (b || '').replace(/^\s*/g, '').replace(/\s{2,}/g, ' ');

  return a === b;
}

function ucFirst(str) {
  return str.charAt(0).toUpperCase() + str.substring(1);
}

var Input = Base.extend({

  attrs: {
    element: {
      value: null,
      setter: function(val) {
        return $(val);
      }
    },
    query: null,
    delay: 100
  },

  initialize: function() {
    Input.superclass.initialize.apply(this, arguments);

    // bind events
    this._bindEvents();

    // init query
    this.set('query', this.getValue());
  },

  focus: function() {
    this.get('element').focus();
  },

  getValue: function() {
    return this.get('element').val();
  },

  setValue: function(val, silent) {
    this.get('element').val(val);
    silent || this._change();
  },

  destroy: function() {
    Input.superclass.destroy.call(this);
  },

  _bindEvents: function() {
    this.get('element').attr('autocomplete', 'off')
      .on('focus.autocomplete', wrapFn(this._handleFocus, this))
      .on('blur.autocomplete', wrapFn(this._handleBlur, this))
      .on('keydown.autocomplete', wrapFn(this._handleKeydown, this))
      .on('input.autocomplete', wrapFn(this._change, this));
  },

  _change: function() {
    var newVal = this.getValue();
    var oldVal = this.get('query');
    var isSame = compare(oldVal, newVal);
    var isSameExpectWhitespace = isSame ? (newVal.length !== oldVal.length) : false;

    if (isSameExpectWhitespace) {
      this.trigger('whitespaceChanged', oldVal);
    }

    if (!isSame) {
      this.set('query', newVal);
      this.trigger('queryChanged', newVal, oldVal);
    }
  },

  _handleFocus: function(e) {
    this.trigger('focus', e);
  },

  _handleBlur: function(e) {
    this.trigger('blur', e);
  },

  _handleKeydown: function(e) {
    var keyName = specialKeyCodeMap[e.which];

    if (keyName) {
      this.trigger(e.type = 'key' + ucFirst(keyName), e);
    }
  }
});

module.exports = Input;
