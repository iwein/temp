define(function(require) {
  'use strict';
  require('tools/config-api');
  require('session');
  var module = require('app-module');

  module.controller('CandidateSignupSkillsCtrl', function($scope, ConfigAPI, Session) {
    this.searchSkills = ConfigAPI.skills;
    this.remove = remove;
    this.onChange = onChange;
    this.onBlur = onBlur;
    this.submit = submit;
    $scope.loading = false;
    var skills = $scope.model = [{}];

    ConfigAPI.skillLevels().then(function(data) {
      $scope.levels = data;
    });

    function last() {
      return skills[skills.length - 1];
    }

    function remove(index) {
      skills.splice(index, 1);
    }

    function onBlur(entry, index) {
      if (!entry.skill && entry !== last())
        remove(index);
    }

    function onChange() {
      if (last().skill)
        skills.push({});
    }

    function submit() {
      var data = skills.slice();
      data.pop();

      $scope.loading = true;
      Session.setSkills(data).then(function() {
        return $scope.signup.nextStep();
      }).finally(function() {
        this.loading = false;
      });
    }
  });

  return {
    url: '/skills',
    template: require('text!./candidate-signup-skills.html'),
    controller: 'CandidateSignupSkillsCtrl',
    controllerAs: 'signupSkills',
  };
});
