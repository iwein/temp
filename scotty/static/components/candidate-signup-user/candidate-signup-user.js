// jshint camelcase:false

define(function(require) {
  'use strict';
  require('tools/candidate-session');
  var module = require('app-module');

  module.controller('CandidateSignupUserCtrl', function($scope, $q, CandidateSession) {
    this.submit = submit;

    function submit() {
      var userData = {
        first_name: $scope.firstName,
        last_name: $scope.lastName,
        email: $scope.email,
        pwd: $scope.password,
      };

      CandidateSession.signup(userData).then(function() {
        var position = $scope.signup.data.target;
        var cities = $scope.signup.data.cities;

        return $q.all([
          CandidateSession.setTargetPosition(position),
          CandidateSession.setPreferredCities(cities),
        ]);
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
