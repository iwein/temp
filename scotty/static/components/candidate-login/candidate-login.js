define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('CandidateLoginCtrl', function($scope, $state, toaster, Session) {
    this.submit = submit;
    $scope.error = false;
    $scope.loading = false;

    function submit(email, password) {
      $scope.error = false;
      $scope.loading = true;

      Session.login(email, password).then(function() {
        return Session.isSignupComplete();
      }, function(error) {
        toaster.error('Invalid email or password.');
        throw error;
      }).then(function(isComplete) {
        $state.go(isComplete ? 'home' : 'signup');
      }).finally(function() {
        $scope.loading = false;
      });
    }
  });


  return {
    url: '/login/',
    template: require('text!./candidate-login.html'),
    controller: 'CandidateLoginCtrl',
    controllerAs: 'login',
  };
});
