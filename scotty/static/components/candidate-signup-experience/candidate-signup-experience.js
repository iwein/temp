define(function(require) {
  'use strict';
  require('tools/config-api');
  require('session');
  var module = require('app-module');

  var months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  module.controller('CandidateSignupExperienceCtrl', function($scope, $q, $state, ConfigAPI, Session) {
    this.searchCompanies = ConfigAPI.companies;
    this.searchLocations = ConfigAPI.locationsText;
    this.searchJobTitles = ConfigAPI.jobTitles;
    this.searchRoles = ConfigAPI.roles;
    this.addAnother = addAnother;
    this.setLocation = setLocation;
    this.submit = submit;
    $scope.months = months;
    $scope.model = {};
    $scope.loading = false;

    bindDate('start');
    bindDate('end');

    ConfigAPI.skillLevels().then(function(data) {
      $scope.levels = data;
    });

    if ($scope.model.location)
      $scope.locationText = ConfigAPI.locationToText($scope.model.location);

    function setLocation(location) {
      var city = ConfigAPI.getLocationFromText(location);
      $scope.errorInvalidCity = city === null;
      $scope.model.location = city;
    }

    function save() {
      if (!$scope.model.location || $scope.errorInvalidCity) {
        $scope.errorInvalidCity = true;
        return $q.reject(new Error('Form data not valid'));
      }

      $scope.loading = true;
      return Session.addExperience($scope.model);
    }

    function addAnother() {
      save().then(function() {
        $scope.model = {};
      }).finally(function() {
        $scope.loading = false;
      });
    }

    function submit() {
      save().then(function() {
        return $scope.signup.nextStep();
      }).then(function() {
        $scope.model = {};
      }).finally(function() {
        $scope.loading = false;
      });
    }

    function bindDate(key) {
      var month = key + 'Month';
      var year = key + 'Year';
      var storedValue = $scope.model[key];

      if (storedValue) {
        var date = new Date(storedValue);
        $scope[year] = date.getFullYear();
        $scope[month] = months[date.getMonth()];
      }

      $scope[key + 'DateUpdate'] = function() {
        var value = null;

        if ($scope[month] && $scope[year]) {
          var date = new Date($scope[year], months.indexOf($scope[month]));
          value = date.getFullYear() + '-' + (date.getMonth() + 1) + '-01';
        }

        $scope.model[key] = value;
      };
    }
  });

  return {
    url: '/experience',
    template: require('text!./candidate-signup-experience.html'),
    controller: 'CandidateSignupExperienceCtrl',
    controllerAs: 'signupExperience',
  };
});
