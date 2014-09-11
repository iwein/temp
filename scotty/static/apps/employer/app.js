define(function(require) {
  'use strict';
  require('session');
  var angular = require('angular');
  var module = require('app-module');

  module.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
    $httpProvider.defaults.withCredentials = true;

    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('home', {})
      .state('login', require('components/employer-login/employer-login'))
      .state('signup', require('components/employer-signup/employer-signup'))
      .state('signup.start', require('components/employer-signup-start/employer-signup-start'))
      .state('signup.basic', require('components/employer-signup-basic/employer-signup-basic'))
      .state('signup.mission', require('components/employer-signup-mission/employer-signup-mission'))
      .state('signup.facts', require('components/employer-signup-facts/employer-signup-facts'))
      .state('signup.benefits', require('components/employer-signup-benefits/employer-signup-benefits'))
      .state('signup.terms', require('components/employer-signup-terms/employer-signup-terms'))
      ;
  });

  module.run(function($state, $templateCache, $rootScope, Session) {
    $rootScope.session = Session;
    Session.checkSession();
    $templateCache.put('navbar.html', require('text!./navbar.html'));

    $rootScope.logout = function() {
      Session.logout().then(function() {
        $state.go('home');
      });
    };
  });

  angular.bootstrap(document, [ 'scotty-employer' ]);
});
