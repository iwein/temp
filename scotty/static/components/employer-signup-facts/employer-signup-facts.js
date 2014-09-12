define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('SignupFactsCtrl', function($scope, ConfigAPI, Session) {
    this.searchTags = ConfigAPI.skills;
    this.onTagChange = onTagChange;
    this.onTagBlur = onTagBlur;
    this.submit = submit;
    $scope.loading = false;
    $scope.model = {};
    $scope.tags = [{}];

    function onTagBlur(entry, index, isLast) {
      if (!entry && !isLast)
        $scope.tags.splice(index, 1);
    }

    function onTagChange(entry, index, isLast) {
      if (entry && isLast)
        $scope.tags.push({});
    }

    function submit() {
      $scope.loading = true;
      $scope.error = false;

      $scope.model.tech_tags = $scope.tags
        .filter(function(item) { return item.value })
        .map(function(item) { return item.value });

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
    url: '/facts/',
    template: require('text!./employer-signup-facts.html'),
    controller: 'SignupFactsCtrl',
    controllerAs: 'signupFacts',
  };
});


