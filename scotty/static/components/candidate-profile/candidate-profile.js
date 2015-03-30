define(function(require) {
  'use strict';
  require('components/element-candidate-status/element-candidate-status');
  require('./availability/availability');
  require('./availability/availability-edit');
  require('./avatar/avatar');
  require('./avatar/avatar-edit');
  require('./birthdate/birthdate');
  require('./birthdate/birthdate-edit');
  require('./completion-social/completion-social');
  require('./completion-target/completion-target');
  require('./contact/contact');
  require('./contact/contact-edit');
  require('./cv/cv');
  require('./cv/cv-edit');
  require('./education/education');
  require('./experience/experience');
  require('./languages/languages');
  require('./languages/languages-edit');
  require('./name/name');
  require('./name/name-edit');
  require('./offers/offers');
  require('./privacy/privacy');
  require('./privacy/privacy-edit');
  require('./salary/salary');
  require('./salary/salary-edit');
  require('./skills/skills');
  require('./skills/skills-edit');
  require('./summary/summary');
  require('./summary/summary-edit');
  require('./target/target');
  require('./target/target-edit');
  var _ = require('underscore');
  var module = require('app-module');


  // jshint maxstatements:35
  module.controller('ProfileCtrl', function($scope, i18n, Loader, Permission, Session) {
    var ctrl = this;
    _.extend(this, {
      edit: edit,
      stopEdit: stopEdit,
      openForm: openForm,
      closeForm: closeForm,
      isFormOpen: false,
      isEditing: false,
    });
    _.extend($scope, {
      getCompletionStep: getCompletionStep,
      isEditing: false,
    });

    onLoad();


    function onLoad() {
      return Permission.requireLogged().then(function refresh() {
        return Session.getUser();
      }).then(function(user) {
        $scope.candidate = user;
        i18n.onChange(translate);
        translate();

        $scope.$watch('candidate.$revision', function() {
          $scope.completion = getCompletionStep();
        });

        return Promise.all([
          user.getTargetPosition(),
          user.getExperience(),
          user.getEducation(),
          user.getOffers().then(function(offers) {
            $scope.allOffers = offers;
          }),
        ]);
      }).then(function() {
        $scope.ready = true;
      }).finally(function() {
        Loader.page(false);
      });
    }

    function translate() {
      $scope.lang = i18n.getCurrent();
    }

    function getCompletionStep() {
      var targetPosition = $scope.candidate.getTargetPositionCached();
      var hasTargetPosition = (
        targetPosition &&
        targetPosition.role &&
        targetPosition.minimum_salary &&
        targetPosition.skills.length
      );
      if (!hasTargetPosition)
        return 'target';

      var education = $scope.candidate.getEducationCached();
      var experience = $scope.candidate.getExperienceCached();
      var hasExperienceEducation = (
        education && education.length &&
        experience && experience.length
      );
      if (!hasExperienceEducation)
        return 'social';
    }

    function edit() {
      $scope.isEditing = true;
      ctrl.isEditing = true;
    }

    function stopEdit() {
      $scope.isEditing = false;
      ctrl.isEditing = false;
      closeForm();
    }

    function openForm(id) {
      edit();
      $scope.editClass = 'editing-' + id;
      $scope.isFormOpen = true;
      ctrl.isFormOpen = true;
    }

    function closeForm() {
      $scope.editClass = '';
      $scope.isFormOpen = false;
      ctrl.isFormOpen = false;
    }
  });


  return {
    url: '/profile/',
    template: require('text!./candidate-profile.html'),
    controller: 'ProfileCtrl',
    controllerAs: 'profile'
  };
});
