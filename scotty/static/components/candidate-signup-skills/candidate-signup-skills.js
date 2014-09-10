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

    function remove(index) {
      skills.splice(index, 1);
    }

    function onBlur(entry, index, isLast) {
      if (!entry.skill && !isLast)
        remove(index);
    }

    function onChange(entry, index, isLast) {
      if (entry.skill && isLast)
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
    url: '/skills/',
    template: require('text!./candidate-signup-skills.html'),
    controller: 'CandidateSignupSkillsCtrl',
    controllerAs: 'signupSkills',
  };
});
