define(function(require) {
  'use strict';
  require('session');
  var angular = require('angular');
  var module = require('app-module');

  module.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
    $httpProvider.defaults.withCredentials = true;

    $urlRouterProvider.otherwise('/home');

    $stateProvider
      .state('home', require('components/candidate-home/candidate-home'))
      .state('login', require('components/candidate-login/candidate-login'))
      .state('activate', require('components/candidate-activate/candidate-activate'))
      .state('profile', require('components/candidate-profile-basic/candidate-profile-basic'))
      .state('signup', require('components/candidate-signup/candidate-signup'))
      .state('signup.target', require('components/candidate-signup-target/candidate-signup-target'))
      .state('signup.user', require('components/candidate-signup-user/candidate-signup-user'))
      .state('signup.experience', require('components/candidate-signup-experience/candidate-signup-experience'))
      .state('signup.skills', require('components/candidate-signup-skills/candidate-signup-skills'))
      .state('signup.education', require('components/candidate-signup-education/candidate-signup-education'))
      .state('signup.languages', require('components/candidate-signup-languages/candidate-signup-languages'))
      .state('signup.photo', require('components/candidate-signup-photo/candidate-signup-photo'))
      .state('signup.activate', require('components/candidate-signup-activate/candidate-signup-activate'))
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

  angular.bootstrap(document, [ 'scotty-candidate' ]);
});
