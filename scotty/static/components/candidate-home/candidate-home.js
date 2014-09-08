define(function(require) {
  'use strict';
  require('tools/candidate-session');
  var module = require('app-module');


  module.controller('CandidateHomeCtrl', function($state, CandidateSession) {
    CandidateSession.whenReady(function() {
      if (CandidateSession.hasSession()) {
        CandidateSession.isSignupComplete().then(function(result) {
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
