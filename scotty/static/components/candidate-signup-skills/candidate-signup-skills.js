define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-skills-form/directive-skills-form');
  var module = require('app-module');

  module.controller('CandidateSignupSkillsCtrl', function($scope, $q, Loader, ConfigAPI, Session) {
    this.submit = submit;
    $scope.loading = false;
    $scope.ready = false;
    Loader.page(true);

    Session.getUser().then(function(user) {
      return $q.all([
        user.getData(),
        user.getTargetPosition(),
      ]);
    }).then(function(data) {
      var skills = data[0].skills;
      var tpSkills = data[1].skills.map(function(skill) {
        return { skill: skill, level: true };
      });
      return $scope.form.setModel(skills.length ? skills : tpSkills);
    }).finally(function() {
      $scope.ready = true;
      Loader.page(false);
    });

    function submit() {
      if(!$scope.form.$valid)return;

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
