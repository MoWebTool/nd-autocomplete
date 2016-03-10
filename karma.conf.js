'use strict'

var argv = require('yargs').argv

module.exports = function(config) {
  config.set({

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha'],

    // list of files / patterns to load in the browser
    files: [
      './node_modules/phantomjs-polyfill/bind-polyfill.js',
      './node_modules/sinon/pkg/sinon.js',
      {
        pattern: 'tests/**/*.spec.js',
        watched: false,
        served: true,
        included: true
      }
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'tests/**/*.spec.js': ['webpack', 'sourcemap']
    },

    webpack: {
      devtool: 'inline-source-map',
      resolve: {
        root: './',
        extensions: ['', '.js'],
        modulesDirectories: ['node_modules']
      },
      module: {
        preLoaders: [{
          test: /\.js$/,
          loader: 'isparta',
          exclude: /node_modules|tests/
        }],
        loaders: [{
          test: /\.handlebars$/,
          loader: 'handlebars'
        }]
      },
    },

    webpackMiddleware: {
      noInfo: true
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha', 'coverage'],

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: !argv.watch,

    // optionally, configure the reporter
    coverageReporter: {
      reporters: [
        { type : 'text-summary' },
        { type : 'lcov', dir : 'coverage' }
      ]
    }
  })
}
