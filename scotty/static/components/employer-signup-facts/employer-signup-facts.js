define(function(require) {
  'use strict';
  require('session');
  var _ = require('underscore');
  var module = require('app-module');

  module.controller('SignupFactsCtrl', function($scope, toaster, ConfigAPI, Session) {
    this.searchTags = ConfigAPI.skills;
    this.submit = submit;
    $scope.loading = true;
    $scope.model = { tech_tags: [] };

    Session.getUserData().then(function(data) {
      $scope.model = _.pick(data, [
        'founding_year',
        'revenue_pa',
        'funding_amoun',
        'no_of_employees',
        'tech_team_size',
        'tech_tags',
      ]);
    }).finally(function() {
      $scope.loading = false;
    });

    function submit() {
      if (!$scope.model.tech_tags.length) {
        $scope.techTags.setDirty(true);
        return;
      }

      $scope.loading = true;

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
    url: '/facts/',
    template: require('text!./employer-signup-facts.html'),
    controller: 'SignupFactsCtrl',
    controllerAs: 'signupFacts',
  };
});


