define(function(require) {
  'use strict';
  var module = require('app-module');


  var validStates = {
    'start': [ 'signup.user' ],
    'target_position': [ 'signup.target' ],
    'work_experience': [ 'signup.experience' ],
    'education': [ 'signup.education' ],
    'skills': [ 'signup.skills' ],
    'languages': [ 'signup.languages' ],
    'profile': [ 'signup.profile' ],
    'end': [ 'signup-complete' ]
  };
  var order = [
    'signup.user',
    'signup.target',
    'signup.experience',
    'signup.education',
    'signup.skills',
    'signup.languages',
    'signup.profile',
    'signup-complete',
  ];


  module.controller('CandidateSignupCtrl', function($scope, $state, Session) {
    this.target = { company_types: [] };
    this.cities = [];

    // This will fire connectors checking
    Session.getConnectors().getConnected();

    // Create and invoke controller
    require('tools/signup-controller')('candidate', order, validStates)
      .call(this, $scope, $state, Session);
  });



  return {
    url: '/signup',
    template: require('text!./candidate-signup.html'),
    controller: 'CandidateSignupCtrl',
    controllerAs: 'signup'
  };
});
