define(function(require) {
  'use strict';
  require('tools/search-api');
  var module = require('app-module');

  module.controller('CandidateSignupExperience1Ctrl', function($scope, SearchAPI) {
    this.searchCompanies = SearchAPI.companies;
    this.searchLocations = SearchAPI.locations;
    this.searchJobTitles = SearchAPI.jobTitles;
    this.setLocation = setLocation;

    if ($scope.signup.experience.location)
      $scope.locationText = SearchAPI.locationToText($scope.signup.experience.location);

    function setLocation(location) {
      $scope.signup.experience.location = SearchAPI.getLocationFromText(location);
    }
  });

  return {
    url: '/experience',
    template: require('text!./candidate-signup-experience1.html'),
    controller: 'CandidateSignupExperience1Ctrl',
    controllerAs: 'signupExperience1',
  };
});
