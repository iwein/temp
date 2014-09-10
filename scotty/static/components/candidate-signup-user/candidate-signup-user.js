// jshint camelcase:false

define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('CandidateSignupUserCtrl', function($scope, $q, $state, Session) {
    this.submit = submit;
    $scope.loading = false;
    $scope.model = {};

    function submit() {
      $scope.loading = true;

      Session.signup($scope.model).then(function() {
        var availability = $scope.signup.availability;
        var position = $scope.signup.target;
        var cities = $scope.signup.cities;

        return $q.all([
          Session.updateData(availability),
          Session.addTargetPosition(position),
          Session.setPreferredCities(cities),
        ]);
      }).then(function() {
        return $scope.signup.nextStep();
      }).finally(function() {
        $scope.loading = false;
      });
    }
  });

  return {
    url: '/user/',
    template: require('text!./candidate-signup-user.html'),
    controller: 'CandidateSignupUserCtrl',
    controllerAs: 'signupUser',
  };
});
