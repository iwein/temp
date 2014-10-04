define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-education/directive-education');
  require('components/directive-education-form/directive-education-form');
  var module = require('app-module');

  module.controller('CandidateSignupEducationCtrl', function($scope, $state, Session) {
    $scope.importLinkedin = importLinkedin;
    $scope.saveImported = saveImported;
    $scope.skipImported = skipImported;
    $scope.setAddAnother = setAddAnother;
    $scope.model = {};
    $scope.ready = false;
    $scope.education = null;
    $scope.current = 0;
    this.nextStep = nextStep;
    this.submit = submit;
    this.edit = edit;
    var linkedin = Session.getLinkedIn();

    Session.checkSession().finally(function() {
      $scope.ready = true;
    });

    if ($state.params.import)
      importLinkedin();

    function saveImported() {
      $scope.loading = true;
      $scope.importForm.save()
        .then(skipImported)
        .then(function() {
          $scope.list.refresh();
        })
        .finally(function() {
          $scope.loading = false;
        });
    }

    function skipImported() {
      $scope.current++;
      nextImported();
    }

    function nextImported() {
      $scope.importForm.reset();
      if ($scope.current < $scope.education.length)
        $scope.importForm.setModel($scope.education[$scope.current]);
      else
        $scope.importing = false;
    }

    function importLinkedin() {
      $scope.loading = true;
      linkedin.getEducation().then(function(education) {
        $scope.loading = false;
        $scope.importing = true;
        $scope.education = education;
        $scope.current = 0;
        nextImported();
      });
    }

    function setAddAnother(value) {
      $scope.addAnother = value;
    }

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
    url: '/education/:import',
    template: require('text!./candidate-signup-education.html'),
    controller: 'CandidateSignupEducationCtrl',
    controllerAs: 'signupEducation',
  };
});
