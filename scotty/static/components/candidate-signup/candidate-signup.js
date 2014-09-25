define(function(require) {
  'use strict';
  var module = require('app-module');


  var validStates = {
    'start': [
      'signup.target',
      'signup.user',
    ],
    'target_positions': [
      'signup.target',
      'signup.user',
    ],
    'work_experience': [ 'signup.experience' ],
    'education': [ 'signup.education' ],
    'skills': [ 'signup.skills' ],
    'languages': [ 'signup.languages' ],
    'image': [ 'signup.profile' ],
    'active': [ 'signup.activate' ],
    'end': [ 'profile' ],
  };
  var order = [
    'signup.target',
    'signup.user',
    'signup.experience',
    'signup.education',
    'signup.skills',
    'signup.languages',
    'signup.profile',
    'signup.activate',
    'profile',
  ];


  module.controller('CandidateSignupCtrl', function($scope, $state, Session) {
    var signup = this;
    this.target = { company_types: [] };
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
        signup.target.minimum_salary
        // &&
        // (signup.cities.length || signup.dont_care_location)
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
