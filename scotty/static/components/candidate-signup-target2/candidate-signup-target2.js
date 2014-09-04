define(function(require) {
  'use strict';
  require('tools/search-api');
  var module = require('app-module');

  module.controller('CandidateSignupTarget2Ctrl', function($scope, $state, SearchAPI) {
    this.searchCities = SearchAPI.locations;
    this.cityText = SearchAPI.locationToText;
    this.addCity = addCity;
    this.removeCity = removeCity;
    this.submit = submit;

    function addCity() {
      var cities = $scope.signup.cities;
      var city = $scope.currentCity;
      $scope.currentCity = '';

      if (cities.map(SearchAPI.locationToText).indexOf(city) !== -1)
        return;

      cities.push(SearchAPI.getLocationFromText(city));
    }

    function removeCity(city) {
      var cities = $scope.signup.cities;
      cities.splice(cities.indexOf(city), 1);
    }

    function submit() {
      if ($scope.signup.cities.length)
        $state.go('^.user');
    }
  });

  return {
    url: '/target-position-2',
    template: require('text!./candidate-signup-target2.html'),
    controller: 'CandidateSignupTarget2Ctrl',
    controllerAs: 'signupTarget2',
  };
});
