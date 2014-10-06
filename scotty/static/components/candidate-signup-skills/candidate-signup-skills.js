define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-skills-form/directive-skills-form');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.controller('CandidateSignupSkillsCtrl', function($scope, Loader, ConfigAPI, Session) {
    this.submit = submit;
    $scope.loading = false;
    $scope.ready = false;
    Loader.page(true);

    Session.getUser()
      .then(fn.invoke('getData', []))
      .then(function(data) { $scope.form.setModel(data.skills) })
      .finally(function() {
        $scope.ready = true;
        Loader.page(false);
      });

    function submit() {
      $scope.loading = true;
      Loader.add('signup-skills-saving');

      $scope.form.save().then(function() {
        return $scope.signup.nextStep();
      }).finally(function() {
        $scope.loading = false;
        Loader.remove('signup-skills-saving');
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
