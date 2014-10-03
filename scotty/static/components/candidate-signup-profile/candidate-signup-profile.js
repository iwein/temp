define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-profile-form/directive-profile-form');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.controller('CandidateSignupProfileCtrl', function($scope, $q, ConfigAPI, Session) {
    this.submit = submit;
    $scope.loading = false;
    $scope.ready = false;

    Session.getUser()
      .then(fn.invoke('getData', []))
      .then(function(data) {
        $scope.ready = true;
        $scope.form.setModel(_.omit(data, [
          'skills',
          'languages',
          'preferred_location',
          'work_experience',
          'activation_token',
          'email',
          'status',
        ]));
      });

    function submit() {
      $scope.loading = true;
      $scope.form.save().then(function() {
        return $scope.signup.nextStep();
      }).finally(function() {
        $scope.loading = false;
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
