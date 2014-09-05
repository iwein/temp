define(function(require) {
  'use strict';
  require('tools/config-api');
  var module = require('app-module');

  module.controller('CandidateSignupEducation1Ctrl', function($scope, ConfigAPI) {
    this.searchInstitutions = ConfigAPI.institutions;
    this.submit = submit;
    $scope.loading = false;

    ConfigAPI.degrees().then(function(data) {
      $scope.degrees = data;
    });

    function submit() {
      $scope.loading = true;
      $scope.signup.nextStep().finally(function() {
        $scope.loading = false;
      });
    }
  });

  return {
    url: '/education',
    template: require('text!./candidate-signup-education1.html'),
    controller: 'CandidateSignupEducation1Ctrl',
    controllerAs: 'signupEducation1',
  };
});
