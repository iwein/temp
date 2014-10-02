define(function(require) {
  'use strict';
  var module = require('app-module');
  var angular = require('angular');
  require('../common/basic-conf')(module);

  module.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/dashboard/');

    $stateProvider
      .state('dashboard', require('components/admin-dashboard/admin-dashboard'))
      .state('offer', require('components/admin-offer/admin-offer'))
      .state('invite-employer', require('components/admin-invite-employer/admin-invite-employer'))
      .state('approve-employers', require('components/admin-approve-employers/admin-approve-employers'))
      .state('search-employers', require('components/admin-search-employers/admin-search-employers'))
      .state('search-candidates', require('components/admin-search-candidates/admin-search-candidates'))
      ;
  });

  module.run(function($templateCache) {
    $templateCache.put('navbar.html', require('text!./navbar.html'));
  });

  angular.bootstrap(document, [ 'scotty-admin' ]);
});
