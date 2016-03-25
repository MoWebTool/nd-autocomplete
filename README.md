# nd-autocomplete

[![Travis](https://img.shields.io/travis/ndfront/nd-autocomplete.svg?style=flat-square)](https://github.com/ndfront/nd-autocomplete)
[![Coveralls](https://img.shields.io/coveralls/ndfront/nd-autocomplete.svg?style=flat-square)](https://github.com/ndfront/nd-autocomplete)
[![NPM version](https://img.shields.io/npm/v/nd-autocomplete.svg?style=flat-square)](https://npmjs.org/package/nd-autocomplete)

> 自动补全组件

## 安装

```bash
$ npm install nd-autocomplete --save
```

## 使用

```js
var AutoComplete = require('nd-autocomplete');
// use AutoComplete
new AutoComplete({
  trigger: 'input[name="user_id"]',
  dataSource: function(keyword, callback){
    // do some query
    callbak([...])
  },
  strict: true
}).render()
```
