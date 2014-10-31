define(function(require) {
  'use strict';
  require('session');
  require('../common/permission');
  var angular = require('angular');
  var module = require('app-module');
  require('../common/basic-conf')(module);

  module.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('dashboard', require('components/employer-dashboard/employer-dashboard'))
      .state('login', require('components/employer-login/employer-login'))
      .state('profile', require('components/employer-profile/employer-profile'))
      .state('forget-password', require('components/shared-forget-password/shared-forget-password'))
      .state('reset-password', require('components/shared-reset-password/shared-reset-password'))

      .state('search-candidates', require('components/employer-search-candidates/employer-search-candidates'))
      .state('candidate', require('components/employer-candidate-profile/employer-candidate-profile'))
      .state('create-offer', require('components/employer-create-offer/employer-create-offer'))
      .state('offer', require('components/employer-offer/employer-offer'))

      .state('signup', require('components/employer-signup/employer-signup'))
      .state('signup.start', require('components/employer-signup-start/employer-signup-start'))
      .state('signup.basic', require('components/employer-signup-basic/employer-signup-basic'))
      .state('signup.mission', require('components/employer-signup-mission/employer-signup-mission'))
      .state('signup.facts', require('components/employer-signup-facts/employer-signup-facts'))
      .state('signup.benefits', require('components/employer-signup-benefits/employer-signup-benefits'))
      .state('signup.terms', require('components/employer-signup-terms/employer-signup-terms'))
      .state('signup.tos', require('components/employer-signup-tos/employer-signup-tos'))
      .state('signup.suggest', require('components/employer-signup-suggest/employer-signup-suggest'))

      .state('static-about-us', require('components/static-about-us/static-about-us'))
      .state('static-tos', require('components/static-tos/static-tos'))
      ;
  });

  module.run(function($state, $templateCache, $rootScope, Session) {
    $templateCache.put('navbar.html', require('text!./navbar.html'));

    $rootScope.session = Session;
    $rootScope.logout = function() {
      Session.logout().then(function() {
        $state.go('login');
      });
    };
  });

  angular.bootstrap(document, [ 'scotty-employer' ]);
});
