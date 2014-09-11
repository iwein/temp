define(function(require) {
  'use strict';
  require('textangular');
  require('session');
  var module = require('app-module');

  module.controller('SignupMissionCtrl', function($scope, $state, ConfigAPI, Session) {
    this.submit = submit;
    $scope.loading = false;
    $scope.missionDirty = false;
    $scope.model = {};

    $scope.$watch('model.mission', function(value) {
      $scope.errorMissionEmpty = !value;
      $scope.missionDirty = $scope.missionDirty || !!value;
    });

    function submit() {
      if (!$scope.errorMissionEmpty)
        return;

      $scope.loading = true;
      Session.signup($scope.model).then(function() {
        $scope.signup.nextStep();
      }).catch(function() {
        $scope.error = true;
      }).finally(function() {
        $scope.loading = false;
      });
    }
  });

  return {
    url: '/mission/',
    template: require('text!./employer-signup-mission.html'),
    controller: 'SignupMissionCtrl',
    controllerAs: 'signupMission',
  };
});


