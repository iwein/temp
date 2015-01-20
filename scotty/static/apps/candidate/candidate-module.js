define(function(require) {
  'use strict';
  require('angular-router');
  require('angular-gettext');
  require('ui.bootstrap');
  require('angulartics-ga');
  var angular = require('angular');

  return angular.module('scotty-candidate', [
    'gettext',
    'ui.router',
    'ui.bootstrap',
    'angulartics',
    'angulartics.google.analytics',
  ]);
});
