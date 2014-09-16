define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');


  var validStates = {
    'start': [
      'signup.target',
      'signup.user',
    ],
    'work_experience': [ 'signup.experience' ],
    'skills': [
      'signup.experience',
      'signup.skills',
    ],
    'education': [ 'signup.education' ],
    'languages': [
      'signup.education',
      'signup.languages',
    ],
    'image': [ 'signup.profile' ],
    'active': [ 'signup.activate' ],
    'end': [ 'profile' ],
  };
  var order = [
    'signup.target',
    'signup.user',
    'signup.experience',
    'signup.skills',
    'signup.education',
    'signup.languages',
    'signup.profile',
    'signup.activate',
    'profile',
  ];


  module.controller('CandidateSignupCtrl', function($scope, $state, Session) {
    var signup = this;
    this.target = {};
    this.cities = [];

    // Create and invoke controller
    require('tools/signup-controller')('candidate', order, validStates, validateStep)
      .call(this, $scope, $state, Session);

    function validateStep(name) {
      if (name === 'signup.user' && !targetPositionCompleted())
        return 'signup.target';
    }

    function targetPositionCompleted() {
      return (
        signup.target.minimum_salary &&
        signup.cities.length
      );
    }
  });



  return {
    url: '/signup',
    template: require('text!./candidate-signup.html'),
    controller: 'CandidateSignupCtrl',
    controllerAs: 'signup',
  };
});
