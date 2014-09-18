define(function(require) {
  'use strict';
  var module = require('app-module');

  module.controller('CandidateLoginCtrl', function($scope, $state, toaster, Session) {
    this.submit = submit;
    $scope.error = false;
    $scope.loading = false;

    function submit(email, password) {
      $scope.error = false;
      $scope.loading = true;

      Session.login(email, password).then(function() {
        return Session.isActivated();
      }, function(error) {
        toaster.error('Invalid email or password.');
        throw error;
      }).then(function(isActivated) {
        $state.go(isActivated ? 'dashboard' : 'signup');
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
