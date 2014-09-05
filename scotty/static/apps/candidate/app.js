define(function(require) {
  'use strict';
  var angular = require('angular');
  var module = require('app-module');

  module.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
    $httpProvider.defaults.withCredentials = true;

    $urlRouterProvider.otherwise('/login');

    $stateProvider
      .state('login', require('components/candidate-login/candidate-login'))
      .state('activate', require('components/candidate-activate/candidate-activate'))
      .state('profile', require('components/candidate-profile-basic/candidate-profile-basic'))
      .state('signup', require('components/candidate-signup/candidate-signup'))
      .state('signup.target1', require('components/candidate-signup-target1/candidate-signup-target1'))
      .state('signup.target2', require('components/candidate-signup-target2/candidate-signup-target2'))
      .state('signup.user', require('components/candidate-signup-user/candidate-signup-user'))
      .state('signup.experience1', require('components/candidate-signup-experience1/candidate-signup-experience1'))
      .state('signup.experience2', require('components/candidate-signup-experience2/candidate-signup-experience2'))
      .state('signup.skills', require('components/candidate-signup-skills/candidate-signup-skills'))
      .state('signup.education1', require('components/candidate-signup-education1/candidate-signup-education1'))
      .state('signup.education2', require('components/candidate-signup-education2/candidate-signup-education2'))
      .state('signup.languages', require('components/candidate-signup-languages/candidate-signup-languages'))
      .state('signup.activate', require('components/candidate-signup-activate/candidate-signup-activate'))
      ;
  });


  require('tools/candidate-session');
  module.run(function($templateCache, $rootScope, CandidateSession) {
    $rootScope.session = CandidateSession;
    $templateCache.put('navbar.html', require('text!./navbar.html'));
  });

  angular.bootstrap(document, [ 'scotty-candidate' ]);
});
