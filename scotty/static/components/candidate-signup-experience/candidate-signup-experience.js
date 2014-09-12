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
    this.searchSkills = ConfigAPI.skills;
    this.searchRoles = ConfigAPI.roles;
    this.addAnother = addAnother;
    this.setLocation = setLocation;
    this.onSkillChange = onSkillChange;
    this.onSkillBlur = onSkillBlur;
    this.submit = submit;
    $scope.months = months;
    $scope.model = {};
    $scope.skills = [{}];
    $scope.loading = false;

    bindDate('start');
    bindDate('end');

    ConfigAPI.skillLevels().then(function(data) {
      $scope.levels = data;
    });

    function setLocation(location) {
      var city = ConfigAPI.getLocationFromText(location);
      $scope.errorInvalidCity = city === null;
      $scope.model.location = city;
    }

    function onSkillBlur(entry, index, isLast) {
      if (!entry && !isLast)
        $scope.skills.splice(index, 1);
    }

    function onSkillChange(entry, index, isLast) {
      if (entry && isLast)
        $scope.skills.push({});
    }

    function save() {
      if (!$scope.model.location || $scope.errorInvalidCity) {
        $scope.errorInvalidCity = true;
        return $q.reject(new Error('Form data not valid'));
      }

      $scope.model.skills = $scope.skills.map(function(item) {
        return item.value;
      });
      $scope.model.skills.pop();

      $scope.loading = true;
      return Session.addExperience($scope.model);
    }

    function addAnother() {
      save().then(function() {
        $scope.formExperience.$setPristine();
        $scope.locationText = '';
        $scope.startMonth = '';
        $scope.startYear = '';
        $scope.endMonth = '';
        $scope.endYear = '';
        $scope.model = {};
        $scope.skills = [{}];
      }).finally(function() {
        $scope.loading = false;
      });
    }

    function submit() {
      save().then(function() {
        return $scope.signup.nextStep();
      }).then(function() {
        $scope.model = {};
        $scope.skills = [{}];
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
    url: '/experience/',
    template: require('text!./candidate-signup-experience.html'),
    controller: 'CandidateSignupExperienceCtrl',
    controllerAs: 'signupExperience',
  };
});
