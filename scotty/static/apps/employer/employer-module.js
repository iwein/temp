define(function(require) {
  'use strict';
  require('angular-router');
  require('angular-gettext');
  require('angular-bootstrap-lightbox');
  require('ui.bootstrap');
  require('textangular');
  require('angulartics-ga');
  var angular = require('angular');

  return angular.module('scotty-employer', [
    'gettext',
    'ui.router',
    'ui.bootstrap',
    'textAngular',
    'bootstrapLightbox',
    'angulartics',
    'angulartics.google.analytics',
  ]);
});
