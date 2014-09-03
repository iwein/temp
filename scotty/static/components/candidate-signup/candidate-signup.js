define(function(require) {
  'use strict';
  require('tools/API');
  var module = require('app-module');

  module.controller('CandidateSignupCtrl', function($scope, API) {
    $scope.searchSkills = typeaheadSearch.bind('skills');
    $scope.searchRoles = typeaheadSearch.bind('roles');
    $scope.searchCities = typeaheadSearch.bind('locations');
    $scope.setCompanyType = setCompanyType;

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
});
