define(function(require) {
  'use strict';
  require('angular-router');
  require('ui.bootstrap');
  var angular = require('angular');

  return angular.module('scotty-candidate', [
    'ui.router',
    'ui.bootstrap',
  ]);
});
