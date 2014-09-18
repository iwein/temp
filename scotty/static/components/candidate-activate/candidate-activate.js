define(function(require) {
  'use strict';
  var module = require('app-module');

  module.controller('CandidateActivateCtrl', function($scope, $state, toaster, Session) {
    Session.activate($state.params.token).then(function() {
      return Session.isActivated();
    }).then(function(result) {
      $scope.success = true;
      $scope.signupComplete = result;
    }, function(request) {
      if (request.status === 404) {
        toaster.error('Invalid invitation token.');
        $scope.failed = true;
      } else
        toaster.defaultError();
    });
  });


  return {
    url: '/activate/:token',
    template: require('text!./candidate-activate.html'),
    controller: 'CandidateActivateCtrl',
    controllerAs: 'activate',
  };
});
