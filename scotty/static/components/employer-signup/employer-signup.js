define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');


  var validStates = {
    'start': [ 'signup.start' ],
    'step1': [ 'signup.basic' ],
    'step2': [ 'signup.offices' ],
    'step3': [ 'signup.mission' ],
    'step4': [ 'signup.facts' ],
    'step5': [ 'signup.benefits' ],
    'step6': [ 'signup.terms' ],
    'end': [ 'signup-complete' ]
  };
  var order = [
    'signup.start',
    'signup.basic',
    'signup.offices',
    'signup.mission',
    'signup.facts',
    'signup.benefits',
    'signup.terms',
    'signup-complete',
  ];


  module.controller('SignupCtrl', function($scope, $state, Session) {
    var validated = null;
    var suggested = null;
    this.atStep = atStep;
    this.nextStep = nextStep;
    this.afterStep = afterStep;
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

    function afterStep(name) {
      if (atStep(name))
        return false;

      var index = order.indexOf(name);
      var current = order.indexOf($state.current.name);
      return index < current;
    }

    function nextStep() {
      var current = $state.current.name;
      var index = order.indexOf(current);
      var next = order[index + 1];
      return loadStep(next);
    }


    function loadStep(name) {
      return getValidStates().then(function(valid) {
        suggested = order.indexOf(valid[valid.length - 1]);

        if (valid.indexOf(name) === -1)
          name = allowPrevSteps(name, valid[0]);

        validated = name;
        $scope.ready = true;
        $state.go(validated);
      });
    }

    function allowPrevSteps(intention, suggestion) {
      var intentionIndex = order.indexOf(intention);
      var suggestionIndex = order.indexOf(suggestion);
      if (intentionIndex === -1 || suggestionIndex === -1)
        return suggestion;

      return intentionIndex <= suggestionIndex ? intention : suggestion;
    }

    function getValidStates() {
      return Session.getSignupStage().then(function(stage) {
        var destination = validStates.end;
        if (!stage)
          return validStates.start;

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
    controllerAs: 'signup'
  };
});
