define(function(require) {
  'use strict';
  require('tools/API');
  var module = require('app-module');

  module.controller('CandidateSignupCtrl', function($scope, API) {
    this.searchSkills = typeaheadSearch.bind('skills');
    this.searchRoles = typeaheadSearch.bind('roles');
    this.searchCities = typeaheadSearch.bind('locations');
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
    url: '/target-position-2',
    template: require('text!./candidate-signup-target2.html'),
    controller: 'CandidateSignupCtrl',
    controllerAs: 'signup',
  };
});
