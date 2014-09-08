define(function(require) {
  'use strict';
  var module = require('app-module');
  var angular = require('angular');

  module.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
    $httpProvider.defaults.withCredentials = true;

    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('home', {});
  });

  require('tools/candidate-session');
  module.run(function($state, $templateCache, $rootScope) {
    $templateCache.put('navbar.html', require('text!./navbar.html'));
  });

  angular.bootstrap(document, [ 'scotty-admin' ]);
});
