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
    this.searchSkills = ConfigAPI.skills;
    this.searchRoles = ConfigAPI.roles;
    this.addAnother = addAnother;
    this.setLocation = setLocation;
    this.addSkill = addSkill;
    this.removeSkill = removeSkill;
    this.skillKeydown = skillKeydown;
    this.submit = submit;
    $scope.months = months;
    $scope.model = { skills: [] };
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

    function addSkill() {
      var index = $scope.model.skills.indexOf($scope.currentSkill);
      if (index === -1)
        $scope.model.skills.push($scope.currentSkill);
      $scope.currentSkill = '';
    }

    function removeSkill(index) {
      $scope.model.skills.splice(index, 1);
    }

    function skillKeydown(event, skill) {
      if (skill && event.keyCode === 13) {
        addSkill();
        event.preventDefault();
      }
    }

    function save() {
      if (!$scope.model.location || $scope.errorInvalidCity) {
        $scope.errorInvalidCity = true;
        return $q.reject(new Error('Form data not valid'));
      }

      if (!$scope.model.skills.length) {
        $scope.formExperience.skill.$dirty = true;
        $scope.currentSkill = '';
        return $q.reject(new Error('Form data not valid'));
      }

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
        $scope.model = { skills: [] };
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
