define(function(require) {
  'use strict';
  require('tools/config-api');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.controller('CandidateSignupTargetCtrl', function($scope, ConfigAPI) {
    this.searchSkills = ConfigAPI.skills;
    this.searchRoles = ConfigAPI.roles;
    this.searchCities = searchCities;
    this.setCountry = setCountry;
    this.onCompanyTypeChange = onCompanyTypeChange;
    this.submit = submit;
    $scope.loading = false;

    ConfigAPI.travelWillingness().then(fn.setTo('willingness', $scope));
    ConfigAPI.countries({ limit: 500 }).then(fn.setTo('countries', $scope));
    ConfigAPI.companyTypes().then(function(data) {
      $scope.companyTypes = data.map(function(type) {
        return { value: type };
      });
    });

    function searchCities(value) {
      return ConfigAPI.locations({
        country_iso: $scope.country,
        q: value,
      }).then(function(locations) {
        return locations.map(fn.get('city'));
      });
    }

    function setCountry(country) {
      var model = $scope.signup.preferred_locations = {};
      model[country] = [];
    }

    function onCompanyTypeChange() {
      $scope.signup.target.company_types = $scope.companyTypes
        .filter(fn.get('selected'))
        .map(fn.get('value'));

      $scope.errorNoCompanyType = !$scope.signup.target.company_types.length;
    }

    function submit() {
      // if (!$scope.country) {
      //  $scope.cities.setDirty(true);
      //  return;
      // }

      if ($scope.errorNoCompanyType)
        return;

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
