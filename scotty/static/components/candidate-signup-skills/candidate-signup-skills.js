define(function(require) {
  'use strict';
  require('tools/list-api');
  require('tools/search-api');
  require('tools/candidate-session');
  var module = require('app-module');

  module.controller('CandidateSignupSkillsCtrl', function(
    $scope,
    $state,
    ListAPI,
    SearchAPI,
    CandidateSession
  ) {
    this.searchSkills = SearchAPI.skills;
    this.remove = remove;
    this.onChange = onChange;
    this.onBlur = onBlur;
    this.submit = submit;
    var skills = $scope.signup.skills;
    skills.push({});

    ListAPI.skillLevels().then(function(data) {
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
      var skills = $scope.signup.skills.slice();
      skills.pop();

      CandidateSession.setSkills(skills).then(function() {
        $scope.signup.skills.pop();
        $state.go('^.education1');
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
