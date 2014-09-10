define(function(require) {
  'use strict';
  require('textangular');
  require('ui.bootstrap');
  var angular = require('angular');

  return angular.module('scotty-employer', [
    'ui.router',
    'ui.bootstrap',
    'textAngular',
  ]);
});
