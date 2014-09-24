define(function(require) {
  'use strict';
  require('tools/config-api');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.controller('CandidateSignupTargetCtrl', function($scope, ConfigAPI) {
    this.searchSkills = ConfigAPI.skills;
    this.searchRoles = ConfigAPI.roles;
    this.locationToText = fn.get('city');
    this.searchCities = searchCities;
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
        country_iso: $scope.signup.preferred_cities.country,
        q: value,
      });
    }

    function onCompanyTypeChange() {
      $scope.signup.target.company_types = $scope.companyTypes
        .filter(fn.get('selected'))
        .map(fn.get('value'));

      $scope.errorNoCompanyType = !$scope.signup.target.company_types.length;
    }

    function submit() {
      // if (!$scope.signup.cities.length && !$scope.signup.dont_care_location) {
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
