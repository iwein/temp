define(function(require) {
  'use strict';
  require('tools/config-api');
  var module = require('app-module');

  module.controller('CandidateSignupExperience1Ctrl', function($scope, ConfigAPI) {
    this.searchCompanies = ConfigAPI.companies;
    this.searchLocations = ConfigAPI.locationsText;
    this.searchJobTitles = ConfigAPI.jobTitles;
    this.setLocation = setLocation;
    this.submit = submit;
    $scope.loading = false;

    if ($scope.signup.experience.location)
      $scope.locationText = ConfigAPI.locationToText($scope.signup.experience.location);

    function setLocation(location) {
      var city = ConfigAPI.getLocationFromText(location);
      $scope.errorInvalidCity = city === null;
      $scope.signup.experience.location = city;
    }

    function submit() {
      if ($scope.errorInvalidCity)
        return;

      $scope.loading = true;
      $scope.signup.nextStep().finally(function() {
        $scope.loading = false;
      });
    }
  });

  return {
    url: '/experience',
    template: require('text!./candidate-signup-experience1.html'),
    controller: 'CandidateSignupExperience1Ctrl',
    controllerAs: 'signupExperience1',
  };
});
