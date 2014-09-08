define(function(require) {
  'use strict';
  var module = require('app-module');
  var angular = require('angular');

  module.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
    $httpProvider.defaults.withCredentials = true;

    $urlRouterProvider.otherwise('/home');

    $stateProvider
      .state('home', require('components/admin-home/admin-home'))
      .state('invite-employer', require('components/admin-invite-employer/admin-invite-employer'))
      .state('approve-employers', require('components/admin-approve-employers/admin-approve-employers'))
      ;
  });

  module.run(function($templateCache) {
    $templateCache.put('navbar.html', require('text!./navbar.html'));
  });

  angular.bootstrap(document, [ 'scotty-admin' ]);
});
