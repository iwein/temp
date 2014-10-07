define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-experience/directive-experience');
  require('components/directive-experience-form/directive-experience-form');
  var module = require('app-module');


  module.controller('CandidateSignupExperienceCtrl', function($scope, $state, Loader, Session) {
    $scope.importLinkedin = importLinkedin;
    $scope.saveImported = saveImported;
    $scope.skipImported = skipImported;
    $scope.setAddAnother = setAddAnother;
    $scope.model = {};
    $scope.ready = false;
    $scope.experience = null;
    $scope.current = 0;
    this.nextStep = nextStep;
    this.submit = submit;
    this.edit = edit;
    var linkedin = Session.getLinkedIn();
    Loader.page(true);

    Session.checkSession().then(function() {
      if ($state.params.import)
        return importLinkedin();
    }).finally(function() {
      $scope.ready = true;
      Loader.page(false);
    });


    function saveImported() {
      $scope.loading = true;
      Loader.add('signup-experience-saving');

      $scope.importForm.save()
        .then(skipImported)
        .then(function() { $scope.list.refresh() })
        .finally(function() {
          $scope.loading = false;
          Loader.remove('signup-experience-saving');
        });
    }

    function skipImported() {
      $scope.current++;
      nextImported();
    }

    function nextImported() {
      $scope.importForm.reset();
      if ($scope.current < $scope.experience.length)
        $scope.importForm.setModel($scope.experience[$scope.current]);
      else
        $scope.importing = false;
    }

    function importLinkedin() {
      $scope.loading = true;
      Loader.add('signup-experience-import');

      linkedin.getExperience().then(function(experience) {
        $scope.loading = false;
        $scope.importing = true;
        $scope.experience = experience;
        $scope.current = 0;
        nextImported();
        $scope.imported = true;
      }).finally(function() {
        Loader.remove('signup-experience-import');
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
      Loader.add('signup-experience-saving');

      form.save()
        .then($scope.addAnother ? addAnother : andContinue)
        .finally(function() {
          $scope.loading = false;
          Loader.remove('signup-experience-saving');
        });
    }
  });

  return {
    url: '/experience/:import',
    template: require('text!./candidate-signup-experience.html'),
    controller: 'CandidateSignupExperienceCtrl',
    controllerAs: 'signupExperience',
  };
});
