define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-target-position-form/directive-target-position-form');
  var _ = require('underscore');
  var module = require('app-module');

  module.controller('CandidateSignupTargetCtrl', function($scope, Loader, toaster) {
    $scope.onSubmit = onSubmit;
    Loader.page(false);
    toaster.info('If you are an employer, click <a href="../employer#signup">here</a>!', {untilStateChange: true});

    function onSubmit(model) {
      localStorage.setItem('scotty:target_position', JSON.stringify(model));
      $scope.signup.target = _.omit(model, 'preferred_locations');
      $scope.signup.preferred_locations = model.preferred_locations;

      $scope.loading = true;
      Loader.add('signup-target-saving');

      $scope.signup.nextStep().finally(function() {
        $scope.loading = false;
        Loader.remove('signup-target-saving');
      });
    }
  });

  return {
    url: '/target-position/',
    template: require('text!./candidate-signup-target.html'),
    controller: 'CandidateSignupTargetCtrl',
    controllerAs: 'signupTarget'
  };
});
