define(function(require) {
  'use strict';
  require('tools/config-api');
  require('session');
  var module = require('app-module');

  module.controller('CandidateSignupTargetCtrl', function($scope, ConfigAPI) {
    this.searchSkills = ConfigAPI.skills;
    this.searchRoles = ConfigAPI.roles;
    this.searchCities = ConfigAPI.locationsText;
    this.cityText = ConfigAPI.locationToText;
    this.addCity = addCity;
    this.removeCity = removeCity;
    this.submit = submit;
    $scope.loading = false;

    ConfigAPI.companyTypes().then(function(data) {
      $scope.companyTypes = data;
    });

    function addCity() {
      var cities = $scope.signup.cities;
      var city = $scope.currentCity;
      $scope.currentCity = '';

      if (cities.map(ConfigAPI.locationToText).indexOf(city) !== -1)
        return;

      cities.push(ConfigAPI.getLocationFromText(city));
    }

    function removeCity(city) {
      var cities = $scope.signup.cities;
      cities.splice(cities.indexOf(city), 1);
    }

    function submit() {
      if (!$scope.signup.cities.length) {
        $scope.formTarget.cities.$dirty = true;
        return;
      }

      if (!$scope.signup.target.company_type) {
        $scope.formTarget.companyType.$dirty = true;
        return;
      }

      $scope.signup.availability = $scope.available_months ?
        { available_months: $scope.available_months } :
        { available_date: $scope.available_date };

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
