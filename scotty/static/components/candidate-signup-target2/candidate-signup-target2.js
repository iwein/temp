define(function(require) {
  'use strict';
  require('tools/config-api');
  var module = require('app-module');

  module.controller('CandidateSignupTarget2Ctrl', function($scope, ConfigAPI) {
    this.searchCities = ConfigAPI.locationsText;
    this.cityText = ConfigAPI.locationToText;
    this.addCity = addCity;
    this.removeCity = removeCity;
    this.submit = submit;
    $scope.loading = false;

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
      if (!$scope.signup.cities.length)
        return;

      $scope.loading = true;
      $scope.signup.nextStep().finally(function() {
        $scope.loading = false;
      });
    }
  });

  return {
    url: '/target-position-2',
    template: require('text!./candidate-signup-target2.html'),
    controller: 'CandidateSignupTarget2Ctrl',
    controllerAs: 'signupTarget2',
  };
});