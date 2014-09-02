define(function(require) {
  'use strict';
  require('components/candidate-home/candidate-home');
  require('components/candidate-login/candidate-login');
  require('components/candidate-register/candidate-register');

  var module = require('app-module');
  var angular = require('angular');

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

  angular.bootstrap(document, [ 'scotty-candidate' ]);
});
