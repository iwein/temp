define(function(require) {
  'use strict';
  var angular = require('angular');
  var module = require('app-module');

  module.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('home', require('components/candidate-home/candidate-home'))
      .state('login', require('components/candidate-login/candidate-login'))
      .state('signup', require('components/candidate-signup/candidate-signup'))
      .state('signup.target1', require('components/candidate-signup-target1/candidate-signup-target1'))
      .state('signup.target2', require('components/candidate-signup-target2/candidate-signup-target2'));
  });


  require('tools/candidate-session');
  module.run(function($rootScope, CandidateSession) {
    $rootScope.session = CandidateSession;
  });

  angular.bootstrap(document, [ 'scotty-candidate' ]);
});
