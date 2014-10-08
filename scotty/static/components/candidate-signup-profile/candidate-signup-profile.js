define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-profile-form/directive-profile-form');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.controller('CandidateSignupProfileCtrl', function($scope, $q, $state, Loader, ConfigAPI, Session) {
    this.submit = submit;
    $scope.importLinkedin = importLinkedin;
    $scope.loading = false;
    $scope.ready = false;
    var linkedin = Session.getLinkedIn();
    Loader.page(true);

    Session.getUser()
      .then(fn.invoke('getData', []))
      .then(function(data) {
        $scope.form.setModel(_.omit(data, [
          'skills',
          'languages',
          'preferred_location',
          'work_experience',
          'activation_token',
          'email',
          'status',
        ]));

        if (data.contact_line1) {
          $scope.imported = true;
          return false;
        }

        if ($state.params.import)
          return true;

        return linkedin.checkConnection();
      })
      .then(function(load) {
        if (load)
          return importLinkedin();
      })
      .finally(function() {
        $scope.ready = true;
        Loader.page(false);
      });

    function importLinkedin() {
      Loader.add('signup-profile-import');
      return linkedin.getProfileData().then(function(data) {
        // TODO: Split address
        $scope.model.address = data.address;
        $scope.model.photo = data.photo;
        $scope.model.dof = data.dof;
        $scope.model.skype = data.skype;
        $scope.imported = true;
      }).finally(function() {
        Loader.remove('signup-profile-import');
      });
    }

    function submit() {
      $scope.loading = true;
      Loader.add('signup-profile-saving');

      $scope.form.save().then(function() {
        return $scope.signup.nextStep();
      }).finally(function() {
        $scope.loading = false;
        Loader.remove('signup-profile-saving');
      });
    }
  });

  return {
    url: '/profile/',
    template: require('text!./candidate-signup-profile.html'),
    controller: 'CandidateSignupProfileCtrl',
    controllerAs: 'signupProfile',
  };
});
