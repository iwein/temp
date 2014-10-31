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
      .state('employer', require('components/admin-employer-profile/admin-employer-profile'))
      .state('candidate', require('components/admin-candidate-profile/admin-candidate-profile'))
      .state('static-pages', require('components/admin-static-pages/admin-static-pages'))
      .state('invite-code', require('components/admin-invite-code/admin-invite-code'))
      .state('invite-employer', require('components/admin-invite-employer/admin-invite-employer'))
      .state('approve-employers', require('components/admin-approve-employers/admin-approve-employers'))
      .state('search-employers', require('components/admin-search-employers/admin-search-employers'))
      .state('search-candidates', require('components/admin-search-candidates/admin-search-candidates'))

      .state('static-about-us', require('components/static-about-us/static-about-us'))
      .state('static-tos', require('components/static-tos/static-tos'))
      ;
  });

  module.run(function($templateCache) {
    $templateCache.put('navbar.html', require('text!./navbar.html'));
  });

  angular.bootstrap(document, [ 'scotty-admin' ]);
});
