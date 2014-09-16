// jshint camelcase:false

define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('CandidateSignupUserCtrl', function($scope, $q, $state, toaster, Session) {
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
          Session.setPreferredCities($scope.signup.dont_care_location ?
            { dont_care_location: true } : cities),
        ]);
      }).then(function() {
        return $scope.signup.nextStep();
      }).catch(function(request) {
        if (request.status === 409)
          toaster.error('Email address already registered.');
        else
          toaster.defaultError();
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
