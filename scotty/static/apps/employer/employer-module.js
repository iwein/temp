define(function(require) {
  'use strict';
  require('angular-router');
  require('angularjs-toaster');
  require('ui.bootstrap');
  require('textangular');
  var angular = require('angular');

  return angular.module('scotty-employer', [
    'toaster',
    'ui.router',
    'ui.bootstrap',
    'textAngular',
  ]);
});
