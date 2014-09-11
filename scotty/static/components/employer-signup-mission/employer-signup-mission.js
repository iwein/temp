define(function(require) {
  'use strict';
  require('textangular');
  require('session');
  var module = require('app-module');

  module.controller('SignupMissionCtrl', function($scope, Session) {
    this.submit = submit;
    $scope.error = false;
    $scope.loading = false;
    $scope.missionDirty = false;
    $scope.model = {};

    $scope.$watch('model.mission', function(value) {
      $scope.errorMissionEmpty = !value;
      $scope.missionDirty = $scope.missionDirty || !!value;
    });

    function submit() {
      if ($scope.errorMissionEmpty)
        return;

      $scope.error = false;
      $scope.loading = true;
      Session.updateData($scope.model).then(function() {
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


