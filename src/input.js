/**
 * @module AutoComplete
 * @author balaixianren <huixiang0922@gmail.com>
 */

'use strict'

var $ = require('nd-jquery')
var Widget = require('nd-widget')

var specialKeyCodeMap = {
  9: 'tab',
  27: 'esc',
  37: 'left',
  39: 'right',
  13: 'enter',
  38: 'up',
  40: 'down'
}

function compare(a, b) {
  a = (a || '').replace(/^\s*/g, '').replace(/\s{2,}/g, ' ')
  b = (b || '').replace(/^\s*/g, '').replace(/\s{2,}/g, ' ')

  return a === b
}

function ucFirst(str) {
  return str.charAt(0).toUpperCase() + str.substring(1)
}

var Input = Widget.extend({

  attrs: {
    element: {
      value: null,
      setter: function(val) {
        return $(val)
      }
    },
    query: null,
    queryOnFocus: false,
    inFilter: function(data) {
      return data
    }
  },

  events: {
    focus: '_handleFocus',
    blur: '_handleBlur',
    keydown: '_handleKeydown',
    input: '_change'
  },

  setup: function() {
    this.element.attr('autocomplete', 'off')

    // init query
    this.set('query', this.getValue())
  },

  focus: function() {
    this.element.focus()
  },

  getValue: function() {
    return this.get('inFilter').call(this, this.element.val())
  },

  setValue: function(val, silent) {
    this.element.val(val)
    silent || this._change()
  },

  _change: function(force) {
    var newVal = this.getValue()
    var oldVal = this.get('query')
    var isSame = compare(oldVal, newVal)
    var isSameExpectWhitespace = isSame ? (newVal.length !== oldVal.length) : false

    if (isSameExpectWhitespace) {
      this.trigger('whitespaceChanged', oldVal)
    }

    if (force || !isSame) {
      this.set('query', newVal)
      this.trigger('queryChanged', newVal, oldVal)
    }
  },

  _handleFocus: function(e) {
    this.trigger('focus', e)

    if (this.get('queryOnFocus')) {
      this._change(true)
    }
  },

  _handleBlur: function(e) {
    this.trigger('blur', e)
  },

  _handleKeydown: function(e) {
    var keyName = specialKeyCodeMap[e.which]

    if (keyName) {
      this.trigger(e.type = 'key' + ucFirst(keyName), e)
    }
  }
})

module.exports = Input
