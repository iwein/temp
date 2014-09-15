define(function(require) {
  'use strict';
  var module = require('app-module');
  var angular = require('angular');

  module.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
    $httpProvider.defaults.withCredentials = true;

    $urlRouterProvider.otherwise('/home');

    $stateProvider
      .state('home', require('components/admin-home/admin-home'))
      .state('invite-employer', require('components/admin-invite-employer/admin-invite-employer'))
      .state('approve-employers', require('components/admin-approve-employers/admin-approve-employers'))
      ;
  });

  module.run(function($templateCache, toaster) {
    $templateCache.put('navbar.html', require('text!./navbar.html'));

    toaster.error = function(message) {
      toaster.pop('error', '', message);
    };
    toaster.warning = function(message) {
      toaster.pop('warning', '', message);
    };
    toaster.info = function(message) {
      toaster.pop('info', '', message);
    };
    toaster.success = function(message) {
      toaster.pop('success', '', message);
    };
    toaster.defaultError = function() {
      toaster.pop(
        'error',
        'Error',
        'Sorry, unknown error ocurred, if this error persist please contact EMAIL_HERE.'
      );
    };
  });

  angular.bootstrap(document, [ 'scotty-admin' ]);
});
