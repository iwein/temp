define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-experience/directive-experience');
  require('components/directive-experience-form/directive-experience-form');
  var module = require('app-module');

  module.controller('CandidateSignupExperienceCtrl', function($scope, Session) {
    $scope.importLinkedin = importLinkedin;
    $scope.saveImported = saveImported;
    $scope.skipImported = skipImported;
    $scope.setAddAnother = setAddAnother;
    $scope.model = {};
    $scope.ready = false;
    this.nextStep = nextStep;
    this.submit = submit;
    this.edit = edit;
    var linkedin = Session.getLinkedIn();
    var current, experience;

    Session.checkSession().finally(function() {
      $scope.ready = true;
    });

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
      current++;
      nextImported();
    }

    function nextImported() {
      $scope.importForm.reset();
      if (current < experience.length)
        $scope.importForm.setModel(experience[current]);
      else
        $scope.importing = false;
    }

    function importLinkedin() {
      $scope.loading = true;
      linkedin.getExperience().then(function(_experience) {
        $scope.loading = false;
        $scope.importing = true;
        experience = _experience;
        current = 0;
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

    function submit(form) {
      $scope.loading = true;
      form.save()
        .then($scope.addAnother ? addAnother : andContinue)
        .finally(function() {
          $scope.loading = false;
        });
    }
  });

  return {
    url: '/experience/',
    template: require('text!./candidate-signup-experience.html'),
    controller: 'CandidateSignupExperienceCtrl',
    controllerAs: 'signupExperience',
  };
});
