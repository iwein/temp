define(function(require) {
  'use strict';
  var module = require('app-module');


  var validStates = {
    'start': [
      'signup.target',
      'signup.user',
    ],
    'target_position': [
      'signup.target',
      'signup.user',
    ],
    'work_experience': [ 'signup.experience' ],
    'education': [ 'signup.education' ],
    'skills': [ 'signup.skills' ],
    'languages': [ 'signup.languages' ],
    'profile': [ 'signup.profile' ],
    'end': [ 'profile' ]
  };
  var order = [
    'signup.target',
    'signup.user',
    'signup.experience',
    'signup.education',
    'signup.skills',
    'signup.languages',
    'signup.profile',
    'profile',
  ];


  module.controller('CandidateSignupCtrl', function($scope, $state, Session) {
    this.target = { company_types: [] };
    this.cities = [];

    // This will fire connectors checking
    Session.getConnectors().getConnected();

    // Create and invoke controller
    require('tools/signup-controller')('candidate', order, validStates, validateStep)
      .call(this, $scope, $state, Session);

    function validateStep(name) {
      if (name === 'signup.user' && !targetPositionStored())
        return 'signup.target';

      if (name === 'signup.target')
        targetPositionStored();
    }

    function targetPositionStored() {
      return localStorage.getItem('scotty:user_id') !== null;
    }
  });



  return {
    url: '/signup',
    template: require('text!./candidate-signup.html'),
    controller: 'CandidateSignupCtrl',
    controllerAs: 'signup'
  };
});
