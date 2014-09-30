define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-education/directive-education');
  require('components/directive-education-form/directive-education-form');
  var module = require('app-module');

  module.controller('CandidateSignupEducationCtrl', function($scope, $state, Session) {
    $scope.setAddAnother = setAddAnother;
    $scope.model = {};
    $scope.ready = false;
    this.nextStep = nextStep;
    this.submit = submit;
    this.edit = edit;

    Session.checkSession().finally(function() {
      $scope.ready = true;
    });

    function nextStep(event) {
      event.preventDefault();
      andContinue();
    }

    function edit(entry) {
      $scope.form.setModel(entry);
    }

    function addAnother() {
      return $scope.list.refresh().then(function() {
        return $scope.form.reset();
      });
    }

    function andContinue() {
      $scope.loading = true;
      return $scope.signup.nextStep().finally(function() {
        $scope.loading = false;
      });
    }

    function setAddAnother(value) {
      $scope.addAnother = value;
    }

    function submit() {
      $scope.loading = true;
      $scope.form.save()
        .then($scope.addAnother ? addAnother : andContinue)
        .finally(function() {
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
