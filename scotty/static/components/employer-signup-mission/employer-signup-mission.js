define(function(require) {
  'use strict';
  require('textangular');
  require('session');
  var _ = require('underscore');
  var module = require('app-module');

  module.controller('SignupMissionCtrl', function($scope, toaster, Session) {
    this.submit = submit;
    $scope.error = false;
    $scope.loading = true;
    $scope.missionDirty = false;
    $scope.model = {};

    $scope.$watch('model.mission_text', function(value) {
      $scope.errorMissionEmpty = !value;
      $scope.missionDirty = $scope.missionDirty || !!value;
    });

    Session.getUser().then(function(user) {
      return user && user.getData();
    }).then(function(data) {
      $scope.model = _.pick(data, [
        'founding_year',
        'revenue_pa',
        'funding_amount',
        'no_of_employees',
        'mission_text',
      ]);
    }).finally(function() {
      $scope.loading = false;
    });

    function submit() {
      if ($scope.errorMissionEmpty) {
        $scope.missionDirty = true;
        return;
      }

      Object.keys($scope.model).forEach(function(key) {
        if (!$scope.model[key])
          delete $scope.model[key];
      });

      $scope.loading = true;
      Session.user.updateData($scope.model).then(function() {
        $scope.signup.nextStep();
      }).catch(function() {
        toaster.defaultError();
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


