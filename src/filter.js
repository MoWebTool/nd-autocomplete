/**
 * @module AutoComplete
 * @author balaixianren <huixiang0922@gmail.com>
 */

'use strict'

// 转义正则关键字
var keyword = /(\[|\[|\]|\^|\$|\||\(|\)|\{|\}|\+|\*|\?|\\)/g

function escapeKeyword(str) {
  return (str || '').replace(keyword, '\\$1')
}

function stringMatch(matchKey, query) {
  var r = [],
    a = matchKey.split('')

  var queryIndex = 0,
    q = query.split('')

  for (var i = 0, l = a.length; i < l; i++) {
    var v = a[i]

    if (v === q[queryIndex]) {
      if (queryIndex === q.length - 1) {
        r.push([i - q.length + 1, i + 1])
        queryIndex = 0

        continue
      }

      queryIndex++
    } else {
      queryIndex = 0
    }
  }

  return r
}


var Filter = {

  'default': function(data) {
    return data
  },

  'startsWith': function(data, query) {
    query || (query = '')

    var result = [],
      l = query.length,
      reg = new RegExp('^' + escapeKeyword(query), 'i')

    if (!l) {
      return []
    }

    data.forEach(function(item) {
      var a, matchKeys = [item.value].concat(item.alias)
      matchKeys = matchKeys.filter(function(item) {
        return item
      })

      // 匹配 value 和 alias 中的
      while ((a = matchKeys.shift())) {
        if (reg.test(a)) {
          // 匹配和显示相同才有必要高亮
          if (item.label === a) {
            item.highlightIndex = [
              [0, l]
            ]
          }

          result.push(item)
          break
        }
      }
    })

    return result
  },


  'stringMatch': function(data, query) {
    query || (query = '')

    var result = [],
      l = query.length

    if (!l) {
      return []
    }

    data.forEach(function(item) {
      var a, matchKeys = [item.value].concat(item.alias)
      matchKeys = matchKeys.filter(function(item) {
        return item
      })

      // 匹配 value 和 alias 中的
      while ((a = matchKeys.shift())) {
        if (a.indexOf(query) > -1) {
          // 匹配和显示相同才有必要高亮
          if (item.label === a) {
            item.highlightIndex = stringMatch(a, query)
          }

          result.push(item)
          break
        }
      }
    })

    return result
  }

}

module.exports = Filter
