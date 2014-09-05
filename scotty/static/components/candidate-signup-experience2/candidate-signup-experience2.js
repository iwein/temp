define(function(require) {
  'use strict';
  require('tools/config-api');
  require('tools/candidate-session');
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

  module.controller('CandidateSignupExperience2Ctrl', function($scope, $state, ConfigAPI, CandidateSession) {
    this.searchRoles = ConfigAPI.roles;
    this.addAnother = addAnother;
    this.submit = submit;
    $scope.months = months;

    bindDate('start');
    bindDate('end');

    ConfigAPI.skillLevels().then(function(data) {
      $scope.levels = data;
    });

    function addAnother() {
      CandidateSession.addExperience($scope.signup.experience).then(function() {
        $state.go('^.experience1');
        $scope.signup.experience = {};
      });
    }

    function submit() {
      CandidateSession.addExperience($scope.signup.experience).then(function() {
        return $scope.signup.nextStep();
      }).then(function() {
        $scope.signup.experience = {};
      });
    }


    function bindDate(key) {
      var month = key + 'Month';
      var year = key + 'Year';
      var storedValue = $scope.signup.experience[key];

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

        $scope.signup.experience[key] = value;
      };
    }
  });

  return {
    url: '/experience-2',
    template: require('text!./candidate-signup-experience2.html'),
    controller: 'CandidateSignupExperience2Ctrl',
    controllerAs: 'signupExperience2',
  };
});
