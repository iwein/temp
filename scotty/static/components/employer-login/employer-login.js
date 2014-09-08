define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('EmployerLoginCtrl', function($scope, $state, Session) {
    this.submit = submit;
    $scope.error = false;
    $scope.loading = false;

    function submit(email, password) {
      $scope.error = false;
      $scope.loading = true;

      Session.login(email, password).then(function() {
        return Session.isSignupComplete();
      }, function(error) {
        $scope.error = true;
        throw error;
      }).then(function(isComplete) {
        $state.go(isComplete ? 'home' : 'signup');
      }).finally(function() {
        $scope.loading = false;
      });
    }
  });


  return {
    url: '/login',
    template: require('text!./employer-login.html'),
    controller: 'EmployerLoginCtrl',
    controllerAs: 'login',
  };
});
