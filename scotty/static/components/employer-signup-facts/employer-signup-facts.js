define(function(require) {
  'use strict';
  require('session');
  var _ = require('underscore');
  var module = require('app-module');

  module.controller('SignupFactsCtrl', function($scope, toaster, Loader, ConfigAPI, Session) {
    this.searchTags = ConfigAPI.skills;
    this.submit = submit;
    $scope.loading = true;
    $scope.model = { tech_tags: [] };
    Loader.page(true);

    Session.getUser().then(function(user) {
      return user && user.getData();
    }).then(function(data) {
      $scope.model = _.pick(data, [
        'tech_team_size',
        'tech_tags',
        'tech_team_philosophy',
      ]);
    }).finally(function() {
      $scope.loading = false;
      Loader.page(false);
    });

    function submit() {
      if (!$scope.model.tech_tags.length) {
        $scope.techTags.setDirty(true);
        return;
      }

      $scope.loading = true;
      Loader.add('signup-facts-saving');

      Object.keys($scope.model).forEach(function(key) {
        if (!$scope.model[key])
          delete $scope.model[key];
      });

      Session.user.updateData($scope.model).then(function() {
        $scope.signup.nextStep();
      }).catch(function() {
        toaster.defaultError();
      }).finally(function() {
        $scope.loading = false;
        Loader.remove('signup-facts-saving');
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


