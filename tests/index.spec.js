'use strict'

var $ = require('nd-jquery')
var chai = require('chai')
var sinonChai = require('sinon-chai')
var AutoComplete = require('../index')
var Filter = require('../src/filter')

var expect = chai.expect
// var sinon = window.sinon

chai.use(sinonChai)

/*globals describe,it*/
Filter.test = function () {
  return []
}

describe('AutoComplete', function() {
  var input
  var ac

  beforeEach(function() {
    input = $('<input id="test" type="text" value="" />').appendTo(document.body)
  })
  afterEach(function() {
    input.remove()
    if (ac) {
      ac.destroy()
      ac = null
    }
    $(document.body).find('input').remove()
  })

  it('new AutoComplete', function() {
    expect(AutoComplete).to.be.a('function')
    ac = new AutoComplete({
      trigger: input,
      dataSource: function() {}
    }).render()
    expect(ac).to.be.an.instanceof(AutoComplete)
  })

  it('normal usage', function() {
    ac = new AutoComplete({
      trigger: input,
      dataSource: function(query, callback) {
        callback(['abc', 'abd', 'cbc'])
      }
    }).render()

    ac.input.setValue('a')

    expect(ac.get('data')).to.eql([{
      label: 'abc',
      value: 'abc',
      target: 'abc',
      alias: []
    }, {
      label: 'abd',
      value: 'abd',
      target: 'abd',
      alias: []
    }, {
      label: 'cbc',
      value: 'cbc',
      target: 'cbc',
      alias: []
    }])
  })

  it('should hide when empty', function () {
    var input = $('#test')
    input.val('a')
    ac = new AutoComplete({
      trigger: input,
      dataSource: function(query, callback) {
        callback(['abc', 'abd', 'cbc'])
      }
    }).render()

    ac.input.setValue('')

    expect(ac.get('visible')).to.not.be.ok
    expect(ac.input.getValue()).to.be.empty
  });

  it('render', function() {
    ac = new AutoComplete({
      trigger: input,
      dataSource: function(query, callback) {
        callback(['abc', 'abd', 'bca'])
      }
    }).render()

    ac.input.setValue('a')

    expect(ac.items.length).to.equal(3)
    expect(ac.items.eq(0).text().replace(/\s/g, '')).to.equal('abc')
    expect(ac.items.eq(1).text().replace(/\s/g, '')).to.equal('abd')
    expect(ac.items.eq(2).text().replace(/\s/g, '')).to.equal('bca')
  })

  it('should be hide when trigger blur #26', function () {
    var input = $('#test')
    ac = new AutoComplete({
      trigger: input,
      dataSource: function(query, callback) {
        callback(['abc', 'abd', 'bca'])
      }
    }).render()
    ac.input.setValue('a')
    ac.input._handleBlur()

    expect(ac.get('visible')).to.not.be.ok
  });

  it('should be hide when mousedown #26', function() {
    ac = new AutoComplete({
      trigger: input,
      dataSource: function(query, callback) {
        callback(['abc', 'abd', 'bca'])
      }
    }).render()

    ac.input.setValue('a')
    ac.items.eq(0).click()

    expect(ac.get('visible')).to.not.be.ok
  })

  describe('filter', function() {
    it('should be "startsWith" by default', function() {
      ac = new AutoComplete({
        trigger: input,
        dataSource: []
      })

      expect(ac.get('filter')).to.equal(Filter['default'])
    })

    it('should support string', function() {
      ac = new AutoComplete({
        trigger: input,
        filter: 'test',
        dataSource: []
      })

      expect(ac.get('filter')).to.equal(Filter.test)
    })

    it('should support string but not exist', function() {
      ac = new AutoComplete({
        trigger: input,
        filter: 'notExist',
        dataSource: []
      })

      expect(ac.get('filter')).to.equal(Filter.default)
    })

    it('should support function', function() {
      var func = function() {}
      ac = new AutoComplete({
        trigger: input,
        filter: func,
        dataSource: []
      })

      expect(ac.get('filter')).to.equal(func)
    })

    it('should support object but not exist', function() {
      ac = new AutoComplete({
        trigger: input,
        filter: 'notExist',
        dataSource: []
      })

      expect(ac.get('filter')).to.equal(Filter.default)
    })

    it('should be called with 4 param', function() {
      var stub = sinon.stub().returns([])
      Filter.filter = stub
      ac = new AutoComplete({
        trigger: input,
        filter: 'filter',
        dataSource: function(query, callback) {
          callback(['abc'])
        }
      }).render()

      ac.input.setValue('a')
      var data = [{
        label: 'abc',
        value: 'abc',
        target: 'abc',
        alias: []
      }]

      expect(stub.withArgs(data, 'a')).to.be.ok
    })
  })

  it('select item', function() {
    var input  = $('#test')
    var spy = sinon.spy()
    ac = new AutoComplete({
      trigger: input,
      dataSource: function(query, callback) {
        callback(['abc', 'abd', 'bca'])
      }
    }).on('itemSelected', spy).render()

    ac.input.setValue('a')
    ac.set('selectedIndex', 0)
    ac.selectItem()
    expect(ac.get('visible')).to.be.false
    expect(input.val()).to.equal('abc')
    expect(ac.input.getValue()).to.equal('abc')
    expect(spy.called).to.be.ok

    ac.input.setValue('ab')
    ac.selectItem(1)
    expect(ac.get('visible')).to.be.false
    expect(input.val()).to.equal('abd')
    expect(ac.input.getValue()).to.equal('abd')
    expect(spy.calledTwice).to.be.ok
  })

  it('specify final input-value individually', function() {
    var input = $('#test')
    ac = new AutoComplete({
      trigger: input,
      filter: 'stringMatch',
      dataSource: function(query, callback) {
        callback(['abc', 'abd', 'bca', {
          value: '天弘增利宝货币 000198 TIANHONGZENGLIBAO',
          label: '天弘增利宝货币 000198',
          target: '000198'
        }])
      }
    }).render()

    ac.input.setValue('TIAN')
    ac.set('selectedIndex', 0)
    ac.selectItem()
    expect(input.val()).to.equal('天弘增利宝货币 000198 TIANHONGZENGLIBAO')
    expect(ac.input.getValue()).to.equal('000198')
  })

  it('clear', function() {
    ac = new AutoComplete({
      trigger: input,
      dataSource: function(query, callback) {
        callback(['abc', 'abd', 'bca'])
      }
    }).render()

    ac.input.setValue('a')

    ac._clear()
    expect(ac.$('[data-role=items]').html()).to.be.empty
    expect(ac.items).to.be.undefined
    expect(ac.currentItem).to.be.undefined
    expect(ac.currentItem).to.be.undefined
    expect(ac.get('selectedIndex')).to.equal(-1)
  })

  it('should support selectFirst', function() {
    ac = new AutoComplete({
      trigger: input,
      selectFirst: true,
      dataSource: function(query, callback) {
        callback(['abc', 'abd', 'bca'])
      }
    }).render()

    ac.input.setValue('a')
    expect(ac.get('selectedIndex')).to.equal(0)
  })

  it('normalize', function() {
    ac = new AutoComplete({
      trigger: input,
      filter: 'default',
      dataSource: [
        'aa',
        'ba', {
          title: 'ab'
        }, {
          value: 'ac'
        }, {
          label: 'bc',
          other: 'bc'
        }, {
          label: 'ad',
          value: 'ad'
        }, {
          label: 'ae',
          value: 'ae',
          alias: ['be']
        }
      ]
    }).render()

    ac.input.setValue('a')
    expect(ac.get('data')).to.eql([{
      label: 'aa',
      value: 'aa',
      target: 'aa',
      alias: []
    },
    {
      label: 'ba',
      value: 'ba',
      target: 'ba',
      alias: []
    },
    {
      label: 'ac',
      value: 'ac',
      target: 'ac',
      alias: []
    },
    {
      label: 'bc',
      value: 'bc',
      target: 'bc',
      alias: [],
      other: 'bc'
    },
    {
      label: 'ad',
      value: 'ad',
      target: 'ad',
      alias: []
    },
    {
      label: 'ae',
      value: 'ae',
      target: 'ae',
      alias: ['be']
    }])
  })

  it('should step', function() {
    ac = new AutoComplete({
      trigger: input,
      dataSource: function(query, callback) {
        callback(['abc', 'abd', 'bca'])
      }
    }).render()

    ac.input.setValue('a')
    ac.items.eq(1).mouseenter()
    expect(ac.get('selectedIndex')).to.equal(1)

    ac.input._handleKeydown(KeyEvent(40))
    expect(ac.get('selectedIndex')).to.equal(2)

    ac.input._handleKeydown(KeyEvent(40))
    expect(ac.get('selectedIndex')).to.equal(-1)

    ac.input._handleKeydown(KeyEvent(38))
    expect(ac.get('selectedIndex')).to.equal(2)

    ac.input._handleKeydown(KeyEvent(38))
    expect(ac.get('selectedIndex')).to.equal(1)
  })

  it('should not contain a #98', function() {
    ac = new AutoComplete({
      trigger: input,
      dataSource: function(query, callback) {
        callback(['abc', 'abd', 'bca'])
      }
    }).render()

    ac.input.setValue('a')
    expect(ac.items.eq(0).find('a')[0]).to.be.undefined
  })
})

function KeyEvent(keyCode) {
  var e = $.Event('keydown.autocomplete');
  e.which = keyCode;
  return e
}
