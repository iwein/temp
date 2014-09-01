define(function(require) {
  'use strict';
  require('components/home/home');
  var module = require('app-module')

  module.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: '../components/home/home.html',
        controller: 'HomeCtrl',
      });
  });

  angular.bootstrap(document, [ 'scotty' ]);
});
