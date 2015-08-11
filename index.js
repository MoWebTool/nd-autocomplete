/**
 * @module AutoComplete
 * @author balaixianren <huixiang0922@gmail.com>
 */

'use strict';

var $ = require('jquery');
var Overlay = require('nd-overlay');
var Template = require('nd-template');
var Spinner = require('nd-spinner');

var Filter = require('./src/filter');
var Input = require('./src/input');

// 标准格式，不匹配则忽略
//
//   {
//     label: '', 显示的字段
//     value: '', 匹配的字段
//     target: '', input的最终值
//     alias: []  其他匹配的字段
//   }
function normalize(data) {
  var result = [];

  data.forEach(function(item) {
    if (!item) {
      return;
    }

    var type = typeof item;

    if (type === 'string') {
      result.push({
        label: item,
        value: item,
        target: item,
        alias: []
      });
    } else if (type === 'object') {
      if (!item.value && !item.label) {
        return;
      }

      item.value || (item.value = item.label);
      item.label || (item.label = item.value);
      item.target || (item.target = item.label);
      item.alias || (item.alias = []);

      result.push(item);
    }
  });

  return result;
}

// 初始化 filter
// 支持的格式
//   1. null: 使用默认的 startsWith
//   2. string: 从 Filter 中找，如果不存在则用 default
//   3. function: 自定义
function initFilter(filter) {
  if (typeof filter === 'function') {
    return filter;
  }

  if (typeof filter === 'string') {
    // 从组件内置的 FILTER 获取
    return Filter[filter] || Filter['default'];
  }

  return Filter['startsWith'];
}

var AutoComplete = Overlay.extend({

  Implements: [Template],

  attrs: {
    zIndex: 999,
    // 触发元素
    trigger: null,
    classPrefix: 'ui-select',
    hoverClass: 'ui-select-hover',
    align: {
      baseXY: [0, '100%-1px']
    },
    // 回车是否会提交表单
    submitOnEnter: false,
    //数据源，1.x版本简化为仅支持 Function
    dataSource: {
      value: null,
      getter: function(val) {
        if (typeof val !== 'function') {
          return function(query, done) {
            done(val);
          };
        }

        return val;
      }
    },
    // 输出过滤
    filter: null,
    disabled: false,
    selectFirst: false,
    // 以下为模板相关
    model: {},
    template: require('./src/element.handlebars'),
    partial: function(data) {
      var template = require('./src/partial.handlebars');

      return template(data, {
        helpers: {
          // 将匹配的高亮文字加上 hl 的样式
          highlightItem: function(label) {
            var index = this.highlightIndex,
              classPrefix = this.parent ? this.parent.classPrefix : '',
              cursor = 0,
              v = label || this.label || '',
              h = '';

            if (Array.isArray(index)) {
              for (var i = 0, l = index.length; i < l; i++) {
                var j = index[i],
                  start, length;
                if (Array.isArray(j)) {
                  start = j[0];
                  length = j[1] - j[0];
                } else {
                  start = j;
                  length = 1;
                }

                if (start > cursor) {
                  h += v.substring(cursor, start);
                }
                if (start < v.length) {
                  var className = classPrefix ? ('class="' + classPrefix + '-item-hl"') : '';
                  h += '<span ' + className + '>' + v.substr(start, length) + '</span>';
                }
                cursor = start + length;
                if (cursor >= v.length) {
                  break;
                }
              }
              if (v.length > cursor) {
                h += v.substring(cursor, v.length);
              }
              return h;
            }
            return v;
          },
          include: function(options) {
            return options.fn($.extend({}, this, options.hash));
          }
        }
      });
    },
    // 以下仅为组件使用
    selectedIndex: null,
    data: [],
    outFilter: function(data) {
      return data.value;
    }
  },

  events: {
    'click [data-role="item"]': '_handleSelection',
    'mousedown [data-role="items"]': '_handleMouseDown',
    'mouseenter [data-role="item"]': '_handleMouseMove',
    'mouseleave [data-role="item"]': '_handleMouseMove'
  },

  parseElement: function() {
    var that = this;
    this.templatePartials || (this.templatePartials = {});

    ['header', 'footer', 'html'].forEach(function(item) {
      that.templatePartials[item] = that.get(item);
    });

    AutoComplete.superclass.parseElement.call(this);
  },

  setup: function() {
    AutoComplete.superclass.setup.call(this);

    this._isOpen = false;
    this._initTrigger();
    this._initInput(); // 初始化输入框
    this._initSpinner();
    this._initFilter(); // 初始化过滤器
    this._bindHandle(); // 绑定事件
    this._blurHide([this.get('trigger')]);
    this._tweakAlignDefaultValue();

    this.on('indexChanged', function(index) {
      this.currItem = this.items.eq(index);
      // scroll current item into view
      this.currItem.get(0).scrollIntoView(false);
    });

    this.after('show', this._setElementWidth);
  },

  show: function() {
    this._isOpen = true;

    // 无数据则不显示
    if (this._isEmpty()) {
      return;
    }

    AutoComplete.superclass.show.call(this);
  },

  hide: function() {
    // 隐藏的时候取消请求或回调
    if (this._timeout) {
      clearTimeout(this._timeout);
    }

    this._hide();
  },

  destroy: function() {
    this._clear();

    if (this.input) {
      this.input.destroy();
      this.input = null;
    }

    if (this.spinner) {
      this.spinner.destroy();
      this.spinner = null;
    }

    AutoComplete.superclass.destroy.call(this);
  },


  // Public Methods
  // --------------
  selectItem: function(index) {
    if (this.items) {
      if (index && this.items.length > index && index >= -1) {
        this.set('selectedIndex', index);
      }

      this._handleSelection();
    }
  },

  // Private Methods
  // ---------------

  // 数据源返回，过滤数据
  _filterData: function(data) {
    // 进行过滤
    this.set('data',
      this.get('filter').call(
        this, normalize(data), this.input.get('query')
      )
    );
  },

  // 通过数据渲染模板
  _onRenderData: function(data) {
    data || (data = []);

    this.element.html(
      this.get('partial').call(this, {
        classPrefix: this.get('classPrefix'),
        items: data,
        query: this.input.get('query'),
        length: data.length
      })
    );

    // 初始化下拉的状态
    this.items = this.$('[data-role="items"]').children();

    if (this.items.length && this.get('selectFirst')) {
      this.set('selectedIndex', 0);
    }

    // 选中后会修改 input 的值并触发下一次渲染，但第二次渲染的结果不应该显示出来。
    this._isOpen && this.show();

    // 默认
    if (!data.length) {
      this.get('field').val(this.get('outFilter')({
        value: this.input.getValue()
      }));
    }
  },

  // 键盘控制上下移动
  _onRenderSelectedIndex: function(index) {
    var hoverClass = this.get('hoverClass');

    this.currItem && this.currItem.removeClass(hoverClass);

    // -1 什么都不选
    if (index === -1) {
      return;
    }

    this.items.eq(index).addClass(hoverClass);
    this.trigger('indexChanged', index, this.lastIndex);
    this.lastIndex = index;
  },

  // 初始化
  // ------------
  _initTrigger: function() {
    var trigger = this.get('trigger');
    this.set('field', trigger.attr('type', 'hidden'));
    this.set('trigger', $('<input type="text" class="' + trigger.attr('class') + '" />').insertBefore(trigger));
  },

  _initInput: function() {
    this.input = new Input({
      element: this.get('trigger')
    });
  },

  _initSpinner: function() {
    this.spinner = new Spinner({
      reference: this.get('trigger'),
      alignment: 'middleright'
    });
  },

  _initFilter: function() {
    this.set('filter', initFilter(this.get('filter')));
  },

  // 事件绑定
  // ------------
  _bindHandle: function() {
    this.on('data', this._filterData, this);

    this.input
      .on('blur', this.hide, this)
      .on('focus', this._handleFocus, this)
      .on('keyEnter', this._handleSelection, this)
      .on('keyEsc', this.hide, this)
      .on('keyUp keyDown', this.show, this)
      .on('keyUp keyDown', this._handleStep, this)
      .on('queryChanged', this._clear, this)
      .on('queryChanged', this._hide, this)
      .on('queryChanged', this._handleQueryChange, this)
      .on('queryChanged', this.show, this);

    this.after('hide', function() {
      this.set('selectedIndex', -1);
    });

    // 选中后隐藏浮层
    this.on('itemSelected', function() {
      this._hide();
    });
  },

  // 选中的处理器
  // 1. 鼠标点击触发
  // 2. 回车触发
  // 3. selectItem 触发
  _handleSelection: function(e) {
    if (!this.items) {
      return;
    }

    var isMouse = e ? e.type === 'click' : false;
    var index = isMouse ? this.items.index(e.currentTarget) : this.get('selectedIndex');
    var item = this.items.eq(index);
    var data = this.get('data')[index];

    if (index >= 0 && item && data) {
      this.input.setValue(data.target, true);
      this.set('selectedIndex', index, {
        silent: true
      });

      // 是否阻止回车提交表单
      if (e && !isMouse && !this.get('submitOnEnter')) {
        e.preventDefault();
      }

      this.get('field').val(this.get('outFilter')(data));

      this.trigger('itemSelected', data, item);
    }
  },

  _handleFocus: function() {
    this._isOpen = true;
  },

  _handleMouseMove: function(e) {
    var hoverClass = this.get('hoverClass');

    this.currItem && this.currItem.removeClass(hoverClass);

    if (e.type === 'mouseenter') {
      var index = this.items.index(e.currentTarget);

      this.set('selectedIndex', index, {
        silent: true
      });

      this.currItem = this.items.eq(index).addClass(hoverClass);
    }
  },

  _handleMouseDown: function(e) {
    e.preventDefault();
  },

  _handleStep: function(e) {
    e.preventDefault();
    this.get('visible') && this._step(e.type === 'keyUp' ? -1 : 1);
  },

  _handleQueryChange: function(val /*, prev*/ ) {
    if (this.get('disabled')) {
      return;
    }

    this.spinner.show();
    this.get('dataSource')(val, function(data) {
      this.spinner.hide();
      this.trigger('data', data);
    }.bind(this));
  },

  // 选项上下移动
  _step: function(direction) {
    var currentIndex = this.get('selectedIndex');
    if (direction === -1) { // 反向
      if (currentIndex > -1) {
        this.set('selectedIndex', currentIndex - 1);
      } else {
        this.set('selectedIndex', this.items.length - 1);
      }
    } else if (direction === 1) { // 正向
      if (currentIndex < this.items.length - 1) {
        this.set('selectedIndex', currentIndex + 1);
      } else {
        this.set('selectedIndex', -1);
      }
    }
  },

  _clear: function() {
    this.$('[data-role=items]').empty();
    this.set('selectedIndex', -1);
    delete this.items;
    delete this.lastIndex;
  },

  _hide: function() {
    this._isOpen = false;
    AutoComplete.superclass.hide.call(this);
  },

  _isEmpty: function() {
    var data = this.get('data');
    return !(data && data.length > 0);
  },

  // 调整 align 属性的默认值
  _tweakAlignDefaultValue: function() {
    var align = this.get('align');
    align.baseElement = this.get('trigger');
    this.set('align', align);
  },

  // trigger 的宽度和浮层保持一致
  _setElementWidth: function() {
    this.element.css('width', $(this.get('trigger')).outerWidth());
    this.off('after:show');
  }

});

module.exports = AutoComplete;
