// jshint camelcase:false

define(function(require) {
  'use strict';
  require('tools/api');
  var extend = require('angular').extend;
  var module = require('app-module');

  module.controller('CandidateSignupTarget1Ctrl', function($scope, $state, API) {
    this.searchSkills = typeaheadSearch.bind(null, 'skills');
    this.searchRoles = typeaheadSearch.bind(null, 'roles');
    this.setCompanyType = setCompanyType;
    this.submit = submit;

    extend($scope, $scope.signup.data.target);

    API.get('/config/company_types').then(function(response) {
      $scope.companyTypes = response.data;
    });

    function setCompanyType(type) {
      $scope.companyType = type;
    }

    function typeaheadSearch(key, term) {
      return API.get('/config/' + key, {
        limit: 10,
        q: term,
      }).then(function(response) {
        return response.data;
      });
    }

    function submit() {
      if (!$scope.companyType) {
        $scope.formTarget1.companyType.$dirty = true;
        return;
      }

      extend($scope.signup.data.target, {
        skill: $scope.skill,
        role: $scope.role,
        companyType: $scope.companyType,
      });

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
