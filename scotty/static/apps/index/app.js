define(function(require) {
  'use strict';
  require('components/home/home');
  var module = require('app-module');
  var angular = require('angular');

  module.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('home', {
        url: '/',
        template: require('text!components/home/home.html'),
        controller: 'HomeCtrl',
      });
  });

  angular.bootstrap(document, [ 'scotty' ]);
});
