define(function(require) {
  'use strict';
  require('angular-router');
  require('angular-gettext');
  require('angular-bootstrap-lightbox');
  require('ui.bootstrap');
  require('angulartics-ga');
  var angular = require('angular');

  return angular.module('scotty-candidate', [
    'gettext',
    'ui.router',
    'ui.bootstrap',
    'bootstrapLightbox',
    'angulartics',
    'angulartics.google.analytics',
  ]);
});
