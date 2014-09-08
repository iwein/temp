define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('CandidateActivateCtrl', function($scope, $state, Session) {
    Session.activate($state.params.token).then(function() {
      return Session.isSignupComplete();
    }).then(function(result) {
      $scope.success = true;
      $scope.signupComplete = result;
    }, function() {
      $scope.error = true;
    });
  });


  return {
    url: '/activate/:token',
    template: require('text!./candidate-activate.html'),
    controller: 'CandidateActivateCtrl',
    controllerAs: 'activate',
  };
});
