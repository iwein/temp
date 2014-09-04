define(function(require) {
  'use strict';
  require('tools/api');
  var module = require('app-module');

  module.controller('CandidateSignupTarget2Ctrl', function($scope, $state, API) {
    var citiesData = null;
    this.searchCities = searchCities;
    this.addCity = addCity;
    this.removeCity = removeCity;
    this.cityText = cityText;
    this.submit = submit;

    function addCity() {
      var cities = $scope.signup.cities;
      var city = $scope.currentCity;
      $scope.currentCity = '';

      if (cities.map(cityText).indexOf(city) !== -1)
        return;

      var data = citiesData.filter(function(entry) {
        return cityText(entry) === city;
      });

      cities.push(data[0]);
    }

    function removeCity(city) {
      var cities = $scope.signup.cities;
      cities.splice(cities.indexOf(city), 1);
    }

    function cityText(entry) {
      return entry.city + ', ' + entry.country_iso;
    }

    function searchCities(term) {
      return API.get('/config/locations', {
        limit: 10,
        q: term,
      }).then(function(response) {
        citiesData = response.data;
        return citiesData.map(cityText);
      });
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
