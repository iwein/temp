define(function(require) {
  'use strict';
  require('tools/api');
  require('tools/search-api');
  var module = require('app-module');

  module.controller('CandidateSignupSkillsCtrl', function($scope, API, SearchAPI) {
    this.searchSkills = SearchAPI.skills;
    $scope.signup.skills.push({});

    API.get('/config/skill_levels').then(function(response) {
      $scope.levels = response.data;
    });
  });

  return {
    url: '/skills',
    template: require('text!./candidate-signup-skills.html'),
    controller: 'CandidateSignupSkillsCtrl',
    controllerAs: 'signupSkills',
  };
});
