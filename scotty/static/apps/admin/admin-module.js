define(function(require) {
  'use strict';
  require('angular-router');
  require('angular-gettext');
  require('ui.bootstrap');
  var angular = require('angular');

  return angular.module('scotty-admin', [
    'gettext',
    'ui.router',
    'ui.bootstrap',
  ]);
});
