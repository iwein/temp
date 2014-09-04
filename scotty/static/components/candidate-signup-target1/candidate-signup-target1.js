define(function(require) {
  'use strict';
  require('tools/list-api');
  require('tools/search-api');
  var module = require('app-module');

  module.controller('CandidateSignupTarget1Ctrl', function($scope, $state, ListAPI, SearchAPI) {
    this.searchSkills = SearchAPI.skills;
    this.searchRoles = SearchAPI.roles;
    this.submit = submit;

    ListAPI.companyTypes().then(function(data) {
      $scope.companyTypes = data;
    });

    function submit() {
      if (!$scope.signup.target.company_type) {
        $scope.formTarget1.companyType.$dirty = true;
        return;
      }

      $state.go('^.target2');
    }
  });

  return {
    url: '/target-position',
    template: require('text!./candidate-signup-target1.html'),
    controller: 'CandidateSignupTarget1Ctrl',
    controllerAs: 'signupTarget1',
  };
});
