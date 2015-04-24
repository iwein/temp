define(function(require) {
  'use strict';
  require('angular-router');
  require('angular-gettext');
  require('angular-bootstrap-lightbox');
  require('ui.bootstrap');
  require('ng-clip');
  require('textangular');
  require('angulartics-ga');
  var angular = require('angular');

  return angular.module('scotty-candidate', [
    'gettext',
    'ui.router',
    'ui.bootstrap',
    'ngClipboard',
    'textAngular',
    'bootstrapLightbox',
    'angulartics',
    'angulartics.google.analytics',
  ]);
});
