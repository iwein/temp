define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-education/directive-education');
  require('components/directive-education-form/directive-education-form');
  var module = require('app-module');


  module.controller('CandidateSignupEducationCtrl', function($scope, $q, Loader, Session) {
    $scope.importLinkedin = importLinkedin;
    $scope.saveImported = saveImported;
    $scope.skipImported = skipImported;
    $scope.setAddAnother = setAddAnother;
    $scope.listReady = listReady;
    $scope.model = {};
    $scope.ready = false;
    $scope.education = null;
    $scope.current = 0;
    this.nextStep = nextStep;
    this.submit = submit;
    this.edit = edit;
    var linkedin = Session.getLinkedIn();
    Loader.page(true);

    Session.checkSession().then(function(session) {
      $scope.ready = session;
    });

    function listReady() {
      $q.when($scope.list.length).then(function(length) {
        if (length > 0) {
          $scope.imported = true;
          return false;
        }
        return linkedin.checkConnection();
      }).then(function(load) {
        if (load)
          return importLinkedin();
      }).finally(function() {
        Loader.page(false);
      });
    }

    function saveImported() {
      $scope.loading = true;
      Loader.add('signup-education-saving');

      $scope.importForm.save()
        .then(skipImported)
        .then(function() { $scope.list.refresh() })
        .finally(function() {
          $scope.loading = false;
          Loader.remove('signup-education-saving');
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
      Loader.add('signup-education-import');

      linkedin.getEducation().then(function(education) {
        $scope.loading = false;
        $scope.importing = true;
        $scope.education = education;
        $scope.current = 0;
        nextImported();
        $scope.imported = true;
      }).finally(function() {
        Loader.remove('signup-education-import');
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
      if ($scope.form.isPristine())
        return andContinue();

      $scope.loading = true;
      Loader.add('signup-education-saving');

      return $scope.form.save()
        .then($scope.addAnother ? addAnother : andContinue)
        .finally(function() {
          $scope.loading = false;
          Loader.remove('signup-education-saving');
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
