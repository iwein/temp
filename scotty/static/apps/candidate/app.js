define(function(require) {
  'use strict';
  require('tools/candidate-session');
  require('components/candidate-home/candidate-home');
  require('components/candidate-login/candidate-login');
  require('components/candidate-register/candidate-register');

  var angular = require('angular');
  var module = require('app-module');

  module.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('home', {
        url: '/',
        template: require('text!components/candidate-home/candidate-home.html'),
        controller: 'CandidateHomeCtrl',
      })
      .state('login', {
        url: '/login',
        template: require('text!components/candidate-login/candidate-login.html'),
        controller: 'CandidateLoginCtrl',
      })
      .state('register', {
        url: '/register',
        template: require('text!components/candidate-register/candidate-register.html'),
        controller: 'CandidateRegisterCtrl',
      });
  });

  module.run(function($rootScope, CandidateSession) {
    $rootScope.session = CandidateSession;
  });

  angular.bootstrap(document, [ 'scotty-candidate' ]);
});
