define(function(require) {
  'use strict';
  require('tools/candidate-session');
  var module = require('app-module');

  module.controller('CandidateHomeCtrl', function(CandidateSession) {
    this.logout = CandidateSession.logout.bind(CandidateSession);
  });


  return {
    url: '/',
    template: require('text!./candidate-home.html'),
    controller: 'CandidateHomeCtrl',
    controllerAs: 'home',
  };
});
