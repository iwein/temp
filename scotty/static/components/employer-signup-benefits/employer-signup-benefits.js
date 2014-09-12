define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('SignupBenefitsCtrl', function($scope, ConfigAPI, Session) {
    this.submit = submit;
    $scope.loading = false;
    $scope.model = {};

    ConfigAPI.benefits().then(function(benefits) {
      $scope.benefits = benefits.map(function(value) {
        return { value: value };
      });
    });

    function submit() {
      $scope.loading = true;
      $scope.error = false;

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
        $scope.error = true;
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
