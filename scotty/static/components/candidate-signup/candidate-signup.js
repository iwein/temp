define(function(require) {
  'use strict';
  require('components/candidate-signup-target1/candidate-signup-target1');
  require('components/candidate-signup-target2/candidate-signup-target2');
  var module = require('app-module');

  module.controller('CandidateSignupCtrl', function($state) {
    $state.go('.target1');
  });

  return {
    url: '/signup',
    template: require('text!./candidate-signup.html'),
    controller: 'CandidateSignupCtrl',
    controllerAs: 'signup',
  };
});
