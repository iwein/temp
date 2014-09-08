define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');


  module.controller('CandidateHomeCtrl', function($state, Session) {
    Session.whenReady(function() {
      if (Session.hasSession()) {
        Session.isSignupComplete().then(function(result) {
          $state.go(result ? 'profile' : 'signup');
        });
      }
    });
  });


  return {
    url: '/home',
    template: require('text!./candidate-home.html'),
    controller: 'CandidateHomeCtrl',
    controllerAs: 'home',
  };
});
