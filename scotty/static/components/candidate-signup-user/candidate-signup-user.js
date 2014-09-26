// jshint camelcase:false

define(function(require) {
  'use strict';
  var module = require('app-module');

  module.controller('CandidateSignupUserCtrl', function($scope, $q, $state, toaster, Session) {
    this.onEmailChange = onEmailChange;
    this.submit = submit;
    $scope.loading = false;
    $scope.model = {};
    $scope.errorAlreadyRegistered = false;

    function onEmailChange() {
      $scope.errorAlreadyRegistered = false;
    }

    function submit() {
      $scope.loading = true;

      Session.signup($scope.model).then(function() {
        var position = $scope.signup.target;
        var locations = $scope.signup.preferred_locations;

        return $q.all([
          Session.user.addTargetPosition(position),
          Session.user.setPreferredLocations(locations),
        ]);
      }).then(function() {
        return $scope.signup.nextStep();
      }).catch(function(request) {
        if (request.status === 409)
          $scope.errorAlreadyRegistered = true;
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
