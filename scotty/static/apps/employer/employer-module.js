define(function(require) {
  'use strict';
  require('angular-router');
  require('angular-gettext');
  require('ui.bootstrap');
  require('textangular');
  require('angulartics-ga');
  var angular = require('angular');

  return angular.module('scotty-employer', [
    'gettext',
    'ui.router',
    'ui.bootstrap',
    'textAngular',
    'angulartics',
    'angulartics.google.analytics',
  ]);
});
