define(function(require) {
  'use strict';
  var module = require('app-module');
  var angular = require('angular');

  module.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('home', {});
  });

  angular.bootstrap(document, [ 'scotty-employer' ]);
});
