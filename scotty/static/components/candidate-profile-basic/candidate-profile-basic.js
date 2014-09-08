define(function(require) {
  'use strict';
  require('tools/candidate-session');
  var module = require('app-module');

  module.controller('ProfileBasicCtrl', function($scope, CandidateSession) {
    CandidateSession.whenReady(function() {
      CandidateSession.isSignupComplete().then(function(result) {
        $scope.isSignupComplete = result;
      });

      CandidateSession.getUserData().then(function(data) {
        $scope.ready = true;
        $scope.cities = data.preferred_cities;
        $scope.languages = data.languages;
        $scope.skills = data.skills;
        $scope.user = data;
      });

      CandidateSession.getTargetPositions().then(function(data) {
        $scope.targetPositions = data;
      });

      CandidateSession.getExperience().then(function(data) {
        $scope.experience = data;
      });

      CandidateSession.getEducation().then(function(data) {
        $scope.education = data;
      });
    });
  });


  return {
    url: '/profile',
    template: require('text!./candidate-profile-basic.html'),
    controller: 'ProfileBasicCtrl',
    controllerAs: 'profile',
  };
});
