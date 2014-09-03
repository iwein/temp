/*globals require */
'use strict';

var tests = Object.keys(window.__karma__.files).filter(function(file) {
  return /unit\.js$/.test(file);
});

requirejs.config({
  // Karma serves files from '/base'
  baseUrl: '/base/',

  paths: {
    'text': 'bower_components/text/text',
    'angular-core': 'bower_components/angular/angular',
    'angular-mocks': 'bower_components/angular-mocks/angular-mocks',
    'angular': 'bower_components/angular-ui-router/release/angular-ui-router',
  },

  shim: {
    'angular': {
      deps: [ 'angular-core', 'angular-mocks' ],
      exports: 'angular'
    },
    'angular-mocks': [ 'angular-core' ]
  },
});

define('app-module', function() {
  return require('angular').module('test', [ 'ui.router' ]);
});

require(tests, window.__karma__.start);
