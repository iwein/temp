define(function(require) {
  'use strict';
  require('tools/config-api');
  require('session');
  var module = require('app-module');
  var validStates = {
    'start': [ 'signup.start' ],
    'step1': [ 'signup.basic' ],
    'step2': [ 'signup.mission' ],
    'step3': [ 'signup.facts' ],
    'step4': [ 'signup.benefits' ],
    'step5': [
      'signup.terms',
      'signup.tos',
    ],
    'end': [ 'signup.suggest' ],
  };
  var order = [
    'signup.start',
    'signup.basic',
    'signup.mission',
    'signup.facts',
    'signup.benefits',
    'signup.terms',
    'signup.suggest',
  ];


  module.controller('SignupCtrl', function($scope, $state, Session) {
    var validated = null;
    this.nextStep = nextStep;
    this.atStep = atStep;
    $scope.ready = false;

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

        validated = name;
        $scope.ready = true;
        $state.go(name);
      });
    }

    function getValidStates() {
      return Session.getSignupStage().then(function(stage) {
        if (!stage)
          return validStates.start;

        var destination = validStates.end;
        stage.ordering.some(function(item) {
          if (!stage[item]) {
            destination = validStates[item];
            return true;
          }
        });
        return destination;
      });
    }
  });


  return {
    url: '/signup',
    template: require('text!./employer-signup.html'),
    controller: 'SignupCtrl',
    controllerAs: 'signup',
  };
});
