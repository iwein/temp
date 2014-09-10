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

  module.controller('CandidateSignupEducationCtrl', function($scope, $state, ConfigAPI, Session) {
    this.searchInstitutions = ConfigAPI.institutions;
    this.searchCourses = ConfigAPI.courses;
    this.searchRoles = ConfigAPI.roles;
    this.addAnother = addAnother;
    this.submit = submit;
    $scope.months = months;
    $scope.model = {};
    $scope.loading = false;

    bindDate('start');
    bindDate('end');

    ConfigAPI.skillLevels().then(function(data) {
      $scope.levels = data;
    });
    ConfigAPI.degrees().then(function(data) {
      $scope.degrees = data;
    });

    function save() {
      $scope.loading = true;
      return Session.addEducation($scope.model);
    }

    function addAnother() {
      save().then(function() {
        $scope.model = {};
        $scope.loading = false;
      });
    }

    function submit() {
      save().then(function() {
        return $scope.signup.nextStep();
      }).then(function() {
        $scope.model = {};
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
    url: '/education/',
    template: require('text!./candidate-signup-education.html'),
    controller: 'CandidateSignupEducationCtrl',
    controllerAs: 'signupEducation',
  };
});
