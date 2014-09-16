define(function(require) {
  'use strict';
  require('angular-router');
  require('angularjs-toaster');
  require('ui.bootstrap');
  var angular = require('angular');

  return angular.module('scotty-candidate', [
    'toaster',
    'ui.router',
    'ui.bootstrap',
  ]);
});
