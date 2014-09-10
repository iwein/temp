define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');
  //var validStates = {};
  var order = [
    'signup.invited',
    'signup.contact',
    'profile',
  ];


  module.controller('SignupCtrl', function($scope, $q, $state) {
    var validated = null;
    this.nextStep = nextStep;
    this.atStep = atStep;
    $scope.ready = true;

    if ($state.current.name === 'signup')
      loadStep('signup.basic');

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
      validated = name;
      $scope.ready = true;
      $state.go(name);
      return $q.when(null);
    }
  });


  return {
    url: '/signup',
    template: require('text!./employer-signup.html'),
    controller: 'SignupCtrl',
    controllerAs: 'signup',
  };
});
