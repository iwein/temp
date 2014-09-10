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
      .state('signup.invited', require('components/employer-signup-invited/employer-signup-invited'))
      .state('signup.basic', require('components/employer-signup-basic/employer-signup-basic'))
      ;
  });

  module.run(function($state, $templateCache, $rootScope, Session) {
    $rootScope.session = Session;
    $templateCache.put('navbar.html', require('text!./navbar.html'));

    $rootScope.logout = function() {
      Session.logout().then(function() {
        $state.go('home');
      });
    };
  });

  angular.bootstrap(document, [ 'scotty-employer' ]);
});
