define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');
  var validStates = {
    'target_positions': [
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
    'languages': [ 'signup.languages' ],
    'image': [ 'signup.photo' ],
    'active': [ 'signup.activate' ]
  };
  var order = [
    'signup.target',
    'signup.user',
    'signup.experience',
    'signup.skills',
    'signup.education',
    'signup.languages',
    'signup.photo',
    'signup.activate',
    'profile',
  ];


  module.controller('CandidateSignupCtrl', function($scope, $state, Session) {
    var signup = this;
    var validated = null;
    this.nextStep = nextStep;
    this.atStep = atStep;
    this.ready = false;
    this.target = {};
    this.cities = [];

    loadStep($state.current.name);

    $scope.$on('$stateChangeStart', function(event, state) {
      if (state.name.indexOf('signup') !== 0)
        return;

      if (validated !== state.name) {
        event.preventDefault();
        loadStep(state.name);
      }
    });

    function atStep(step) {
      return $state.current.name === step;
    }

    function nextStep() {
      var current = $state.current.name;
      var index = order.indexOf(current);
      var next = order[index + 1];
      return loadStep(next);
    }

    function loadStep(name) {
      return getValidStates().then(function(valid) {
        if (valid.indexOf(name) === -1)
          name = valid[0];

        if (name === 'signup.user' && !targetPositionCompleted())
          name = 'signup.target';

        validated = name;
        signup.ready = true;
        $state.go(name);
      });
    }

    function getValidStates() {
      return Session.getSignupStage().then(function(stage) {
        var destination = [ 'profile' ];
        if (!stage)
          return validStates.target_positions;

        stage.ordering.some(function(item) {
          if (!stage[item]) {
            destination = validStates[item];
            return true;
          }
        });

        return destination;
      });
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
