define(function(require) {
  'use strict';
  var module = require('app-module');

  module.controller('EmployerLoginCtrl', function($scope, $state, toaster, Session) {
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
        $state.go(isComplete ? 'dashboard' : 'signup');
      }).finally(function() {
        $scope.loading = false;
      });
    }
  });


  return {
    url: '/login/',
    template: require('text!./employer-login.html'),
    controller: 'EmployerLoginCtrl',
    controllerAs: 'login',
  };
});
