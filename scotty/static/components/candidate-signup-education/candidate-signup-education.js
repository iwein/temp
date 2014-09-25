define(function(require) {
  'use strict';
  require('tools/config-api');
  var fn = require('tools/fn');
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
    this.nextStep = nextStep;
    this.edit = edit;
    this.submit = submit;
    $scope.months = months;
    $scope.model = {};
    $scope.loading = false;

    $scope.ready = false;
    Session.checkSession().finally(function() {
      $scope.ready = true;
    });

    ConfigAPI.skillLevels().then(fn.setTo('levels', $scope));
    ConfigAPI.degrees().then(fn.setTo('degrees', $scope));

    function nextStep(event) {
      event.preventDefault();
      $scope.loading = true;
      $scope.signup.nextStep().finally(function() {
        $scope.loading = false;
      });
    }

    function edit(entry) {
      $scope.model = entry;

      if (!entry.end)
        $scope.current = true;

      if (!entry.degree)
        $scope.not_completed_degree = true;
    }

    function save() {
      $scope.loading = true;
      return Session.user.addEducation($scope.model);
    }

    function addAnother() {
      return save().then(function() {
        return $scope.list.refresh();
      }).then(function() {
        $scope.formEducation.$setPristine();
        $scope.model = {};
      });
    }

    function saveAndContinue() {
      return save().then(function() {
        return $scope.signup.nextStep();
      }).then(function() {
        $scope.model = {};
      });
    }

    function submit() {
      ( $scope.addAnother ?
        addAnother() :
        saveAndContinue()
      ).finally(function() {
        $scope.loading = false;
      });
    }
  });

  return {
    url: '/education/',
    template: require('text!./candidate-signup-education.html'),
    controller: 'CandidateSignupEducationCtrl',
    controllerAs: 'signupEducation',
  };
});
