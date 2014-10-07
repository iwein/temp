define(function(require) {
  'use strict';
  require('session');
  var _ = require('underscore');
  var module = require('app-module');

  module.controller('SignupBenefitsCtrl', function($scope, $q, toaster, Loader, ConfigAPI, Session) {
    this.submit = submit;
    $scope.loading = true;
    $scope.model = {};
    Loader.page(true);

    $q.all([
      ConfigAPI.benefits(),
      Session.getUser().then(function(user) {
        return user && user.getData();
      }),
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
      Loader.page(false);
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

      Loader.add('signup-benefits-saving');
      Session.user.updateData($scope.model).then(function() {
        $scope.signup.nextStep();
      }).catch(function() {
        toaster.defaultError();
      }).finally(function() {
        $scope.loading = false;
        Loader.remove('signup-benefits-saving');
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
