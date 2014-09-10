define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('ProfileBasicCtrl', function($scope, $state, Session) {
    Session.whenReady(function() {
      if (!Session.hasSession()) {
        $state.go('login');
        return;
      }


      Session.isSignupComplete().then(function(result) {
        $scope.isSignupComplete = result;
      });

      Session.getUserData().then(function(data) {
        $scope.ready = true;
        $scope.cities = data.preferred_cities;
        $scope.languages = data.languages;
        $scope.skills = data.skills;
        $scope.user = data;
      });

      Session.getTargetPositions().then(function(data) {
        $scope.targetPositions = data;
      });

      Session.getExperience().then(function(data) {
        $scope.experience = data;
      });

      Session.getEducation().then(function(data) {
        $scope.education = data;
      });
    });
  });


  return {
    url: '/profile/',
    template: require('text!./candidate-profile-basic.html'),
    controller: 'ProfileBasicCtrl',
    controllerAs: 'profile',
  };
});
