define(function(require) {
  'use strict';
  require('tools/config-api');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.controller('CandidateSignupSkillsCtrl', function($scope, ConfigAPI, Session) {
    this.searchSkills = searchSkills;
    this.remove = remove;
    this.onChange = onChange;
    this.onBlur = onBlur;
    this.submit = submit;
    $scope.loading = false;
    $scope.model = [{}];
    $scope.skills = [];

    ConfigAPI.skillLevels().then(fn.setTo('levels', $scope));
    Session.getUser()
      .then(fn.invoke('getData', []))
      .then(function(data) {
        var hasLevel = fn.get('level');

        $scope.model = data.skills
          .filter(hasLevel)
          .concat($scope.model);

        $scope.skills = data.skills
          .filter(fn.not(hasLevel))
          .map(fn.get('skill'))
          .concat($scope.skills);
      });


    function searchSkills(term) {
      var skills = getSkills().map(fn.get('skill'));

      return ConfigAPI.skills(term).then(function(data) {
        return data.filter(function(entry) {
          return skills.indexOf(entry) === -1;
        });
      });
    }

    function remove(index) {
      $scope.model.splice(index, 1);
    }

    function onBlur(entry, index, isLast) {
      if (!entry.skill && !isLast)
        remove(index);
    }

    function onChange(entry, index, isLast) {
      if (entry.skill && isLast)
        $scope.model.push({});
    }

    function getSkills() {
      var withLevel = $scope.model.slice(0, -1);
      var withoutLevel = $scope.skills.map(function(skill) {
        return { skill: skill, level: null };
      });
      return withLevel.concat(withoutLevel);
    }

    function submit() {
      var skills = _.uniq(getSkills(), false, fn.get('skill'));

      $scope.loading = true;
      Session.user.setSkills(skills)
        .then($scope.signup.nextStep)
        .finally(fn.setTo('loading', $scope));
    }
  });

  return {
    url: '/skills/',
    template: require('text!./candidate-signup-skills.html'),
    controller: 'CandidateSignupSkillsCtrl',
    controllerAs: 'signupSkills',
  };
});
