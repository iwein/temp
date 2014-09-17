define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');


  module.controller('DashboardCtrl', function($state, Session) {
    Session.whenReady(function() {
      if (Session.hasSession()) {
        Session.isSignupComplete().then(function(result) {
          $state.go(result ? 'profile' : 'signup');
        });
      }
    });
  });


  return {
    url: '/dashboard/',
    template: require('text!./employer-dashboard.html'),
    controller: 'DashboardCtrl',
    controllerAs: 'dashboard',
  };
});
