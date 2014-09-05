define(function(require) {
  'use strict';
  require('tools/config-api');
  var module = require('app-module');

  module.controller('CandidateSignupTarget1Ctrl', function($scope, ConfigAPI) {
    this.searchSkills = ConfigAPI.skills;
    this.searchRoles = ConfigAPI.roles;
    this.submit = submit;
    $scope.loading = false;

    ConfigAPI.companyTypes().then(function(data) {
      $scope.companyTypes = data;
    });

    function submit() {
      if (!$scope.signup.target.company_type) {
        $scope.formTarget1.companyType.$dirty = true;
        return;
      }

      $scope.loading = true;
      $scope.signup.nextStep().finally(function() {
        $scope.loading = false;
      });
    }
  });

  return {
    url: '/target-position',
    template: require('text!./candidate-signup-target1.html'),
    controller: 'CandidateSignupTarget1Ctrl',
    controllerAs: 'signupTarget1',
  };
});
