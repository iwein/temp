define(function(require) {
  'use strict';
  require('components/MODULE_NAME/MODULE_NAME');
  var module = require('app-module');
  var angular = require('angular');

  module.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('home', {
        url: '/',
        template: require('text!components/MODULE_NAME/MODULE_NAME.html'),
        controller: 'MODULE_NAMECtrl',
      });
  });

  angular.bootstrap(document, [ 'scotty-employer' ]);
});
