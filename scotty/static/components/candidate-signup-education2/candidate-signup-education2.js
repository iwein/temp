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

  module.controller('CandidateSignupEducation2Ctrl', function($scope, $state, ConfigAPI, CandidateSession) {
    this.searchRoles = ConfigAPI.roles;
    this.addAnother = addAnother;
    this.submit = submit;
    $scope.months = months;

    bindDate('start');
    bindDate('end');

    ConfigAPI.skillLevels().then(function(data) {
      $scope.levels = data;
    });

    function saveEducation() {
      return CandidateSession.addEducation($scope.signup.education)
        .then(function(result) {
          $scope.signup.education = {};
          return result;
        });
    }

    function addAnother() {
      saveEducation().then(function() {
        $state.go('^.education1');
      });
    }

    function submit() {
      saveEducation().then(function() {
        //$state.go('^.skills');
        //console.log('Next step');
      });
    }


    function bindDate(key) {
      var month = key + 'Month';
      var year = key + 'Year';
      var storedValue = $scope.signup.education[key];

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

        $scope.signup.education[key] = value;
      };
    }
  });

  return {
    url: '/education-2',
    template: require('text!./candidate-signup-education2.html'),
    controller: 'CandidateSignupEducation2Ctrl',
    controllerAs: 'signupEducation2',
  };
});
