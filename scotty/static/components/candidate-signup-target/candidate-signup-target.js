define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-target-position-form/directive-target-position-form');
  var _ = require('underscore');
  var module = require('app-module');

  module.controller('CandidateSignupTargetCtrl', function($scope) {
    $scope.onSubmit = onSubmit;

    function onSubmit(model) {
      $scope.signup.target = _.omit(model, 'preferred_locations');
      $scope.signup.preferred_locations = model.preferred_locations;

      $scope.loading = true;
      $scope.signup.nextStep().finally(function() {
        $scope.loading = false;
      });
    }
  });

  return {
    url: '/target-position/',
    template: require('text!./candidate-signup-target.html'),
    controller: 'CandidateSignupTargetCtrl',
    controllerAs: 'signupTarget',
  };
});
