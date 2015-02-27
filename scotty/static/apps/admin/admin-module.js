define(function(require) {
  'use strict';
  require('angular-router');
  require('angular-gettext');
  require('ui.bootstrap');
  require('textangular');
  require('angular-bootstrap-lightbox');
  require('tools/table-utils/table-utils');
  var angular = require('angular');

  return angular.module('scotty-admin', [
    'gettext',
    'ui.router',
    'ui.bootstrap',
    'textAngular',
    'bootstrapLightbox',
    'tableUtils'
  ]);
});
