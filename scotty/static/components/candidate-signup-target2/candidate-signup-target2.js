// jshint camelcase:false

define(function(require) {
  'use strict';
  require('tools/api');
  var extend = require('angular').extend;
  var module = require('app-module');

  module.controller('CandidateSignupTarget2Ctrl', function($scope, $state, API) {
    var citiesData = null;
    this.searchCities = searchCities;
    this.addCity = addCity;
    this.removeCity = removeCity;
    this.cityText = cityText;
    this.submit = submit;
    $scope.cities = [];
    $scope.salary = $scope.signup.data.target.minimum_salary;
    $scope.cities = $scope.signup.data.cities;

    function addCity() {
      var city = $scope.currentCity;
      var data = citiesData.filter(function(entry) {
        return cityText(entry) === city;
      })[0];

      $scope.cities.push(data);
      $scope.currentCity = '';
    }

    function removeCity(city) {
      $scope.cities = $scope.cities.filter(function(item) {
        return item !== city;
      });
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
      if (!$scope.cities.length)
        return;

      $scope.signup.data.cities = $scope.cities;
      extend($scope.signup.data.target, {
        minimum_salary: $scope.salary,
      });

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
