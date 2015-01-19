define(function(require) {
  'use strict';
  require('session');
  require('../common/permission');
  var angular = require('angular');
  var module = require('app-module');
  require('../common/basic-conf')(module);

  module.config(function($stateProvider, $urlRouterProvider, $analyticsProvider) {
    $analyticsProvider.prefix = '/employer';
    $urlRouterProvider.otherwise('/dashboard/');

    $stateProvider
      .state('dashboard', require('components/employer-dashboard/employer-dashboard'))
      .state('profile', require('components/employer-profile/employer-profile'))
      .state('reset-password', require('components/shared-reset-password/shared-reset-password'))

      .state('candidate', require('components/employer-candidate-profile/employer-candidate-profile'))
      .state('create-offer', require('components/employer-create-offer/employer-create-offer'))
      .state('offer', require('components/employer-offer/employer-offer'))
      .state('offer-list', require('components/employer-offer-list/employer-offer-list'))

      .state('signup', require('components/employer-signup/employer-signup'))
      .state('signup.start', require('components/employer-signup-start/employer-signup-start'))
      .state('signup.basic', require('components/employer-signup-basic/employer-signup-basic'))
      .state('signup.offices', require('components/employer-signup-offices/employer-signup-offices'))
      .state('signup.mission', require('components/employer-signup-mission/employer-signup-mission'))
      .state('signup.facts', require('components/employer-signup-facts/employer-signup-facts'))
      .state('signup.benefits', require('components/employer-signup-benefits/employer-signup-benefits'))
      .state('signup.terms', require('components/employer-signup-terms/employer-signup-terms'))
      .state('signup.suggest', require('components/employer-signup-suggest/employer-signup-suggest'))
      ;
  });

  module.run(function($window, $templateCache, $rootScope, Session) {
    $templateCache.put('navbar.html', require('text!./navbar.html'));

    $rootScope.session = Session;
    $rootScope.logout = function() {
      Session.logout().then(function() {
        $window.location = '../index.html';
      });
    };
  });

  angular.bootstrap(document, [ 'scotty-employer' ]);
});
