define(function(require) {
  'use strict';
  require('session');
  require('components/directive-target-positions/directive-target-positions');
  require('components/directive-experience/directive-experience');
  require('components/directive-education/directive-education');
  var module = require('app-module');

  module.controller('ProfileCtrl', function($scope, $state, Session) {
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
    });
  });


  return {
    url: '/profile/',
    template: require('text!./candidate-profile.html'),
    controller: 'ProfileCtrl',
    controllerAs: 'profile',
  };
});
