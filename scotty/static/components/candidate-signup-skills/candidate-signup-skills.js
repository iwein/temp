define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-skills-form/directive-skills-form');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.controller('CandidateSignupSkillsCtrl', function($scope, ConfigAPI, Session) {
    this.submit = submit;
    $scope.loading = false;
    $scope.ready = false;

    Session.getUser()
      .then(fn.invoke('getData', []))
      .then(function(data) {
        $scope.ready = true;
        $scope.form.setModel(data.skills);
      });

    function submit() {
      $scope.loading = true;
      $scope.form.save().then(function() {
        $scope.loading = false;
        $scope.signup.nextStep();
      });
    }
  });

  return {
    url: '/skills/',
    template: require('text!./candidate-signup-skills.html'),
    controller: 'CandidateSignupSkillsCtrl',
    controllerAs: 'signupSkills',
  };
});
