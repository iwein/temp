// jshint camelcase:false

define(function(require) {
  'use strict';
  require('tools/candidate-session');
  var module = require('app-module');

  module.controller('CandidateSignupUserCtrl', function($scope, $q, $state, CandidateSession) {
    this.submit = submit;

    function submit() {
      CandidateSession.signup($scope.signup.user).then(function() {
        var position = $scope.signup.target;
        var cities = $scope.signup.cities;

        return $q.all([
          CandidateSession.addTargetPosition(position),
          CandidateSession.setPreferredCities(cities),
        ]);
      }).then(function() {
        $scope.signup.nextStep();
      });
    }
  });

  return {
    url: '/user',
    template: require('text!./candidate-signup-user.html'),
    controller: 'CandidateSignupUserCtrl',
    controllerAs: 'signupUser',
  };
});
