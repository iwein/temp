define(function(require) {
  'use strict';
  require('tools/API');
  var module = require('app-module');

  module.controller('CandidateSignupTarget1Ctrl', function($scope, API) {
    this.searchSkills = typeaheadSearch.bind('skills');
    this.searchRoles = typeaheadSearch.bind('roles');
    this.setCompanyType = setCompanyType;

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
  });

  return {
    url: '/target-position',
    template: require('text!./candidate-signup-target1.html'),
    controller: 'CandidateSignupTarget1Ctrl',
    controllerAs: 'signupTarget1',
  };
});
