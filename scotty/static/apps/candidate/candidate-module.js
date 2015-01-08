define(function(require) {
  'use strict';
  require('angular-router');
  require('ui.bootstrap');
  require('angulartics-ga');
  var angular = require('angular');

  return angular.module('scotty-candidate', [
    'ui.router',
    'ui.bootstrap',
    'angulartics',
    'angulartics.google.analytics',
  ]);
});
