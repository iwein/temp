define(function(require) {
  'use strict';
  require('session');
  var _ = require('underscore');
  var module = require('app-module');

  module.controller('SignupBenefitsCtrl', function($scope, $q, toaster, ConfigAPI, Session) {
    this.submit = submit;
    $scope.loading = true;
    $scope.model = {};

    $q.all([
      ConfigAPI.benefits(),
      Session.getUserData(),
    ]).then(function(result) {
      var benefits = result[0];
      var data = result[1];
      if (!data)
        data = { benefits: [] };

      $scope.model = _.pick(data, [
        'recruitment_process',
        'training_policy',
      ]);

      $scope.benefits = benefits.map(function(value) {
        return {
          value: value,
          selected: data.benefits.indexOf(value) !== -1,
        };
      });
    }).finally(function() {
      $scope.loading = false;
    });

    function submit() {
      $scope.loading = true;

      $scope.model.benefits = $scope.benefits
        .filter(function(benefit) { return benefit.selected })
        .map(function(benefit) { return benefit.value });

      Object.keys($scope.model).forEach(function(key) {
        if (!$scope.model[key])
          delete $scope.model[key];
      });

      Session.updateData($scope.model).then(function() {
        $scope.signup.nextStep();
      }).catch(function() {
        toaster.defaultError();
      }).finally(function() {
        $scope.loading = false;
      });
    }
  });

  return {
    url: '/benefits/',
    template: require('text!./employer-signup-benefits.html'),
    controller: 'SignupBenefitsCtrl',
    controllerAs: 'signupBenefits',
  };
});
