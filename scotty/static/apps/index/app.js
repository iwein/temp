define(function(require) {
  'use strict';
  require('components/home/home');
  var module = require('app-module')

  module.config(function($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: '../components/home/home.html',
        controller: 'HomeCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });

  angular.bootstrap(document, [ 'scotty' ]);
});
