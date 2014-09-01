define(function(require) {
  'use strict';
  var angular = require('angular');

  var deps = [
    'ui.router',
  ];

  if (!DEBUG) {
    deps.push('app-templates');
  }

  return angular.module('scotty-admin', deps);
});
