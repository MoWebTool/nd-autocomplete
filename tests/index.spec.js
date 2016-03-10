'use strict'

// var $ = require('nd-jquery')
var chai = require('chai')
var sinonChai = require('sinon-chai')
var AutoComplete = require('../index')

var expect = chai.expect
// var sinon = window.sinon

chai.use(sinonChai)

/*globals describe,it*/

describe('AutoComplete', function() {

  it('new AutoComplete', function() {
    expect(AutoComplete).to.be.a('function')
    expect(new AutoComplete).to.be.a('object')
  })

})
