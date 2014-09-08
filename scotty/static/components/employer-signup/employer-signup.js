define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('EmployerSignupCtrl', function($scope, $state, Session) {
    this.submit = submit;
    $scope.loading = false;
    $scope.model = {};

    function submit() {
      $scope.loading = true;
      $scope.error = false;

      Session.signup($scope.model).then(function() {
        $state.go('home');
      }).catch(function() {
        $scope.error = true;
      }).finally(function() {
        $scope.loading = false;
      });
    }
  });

  return {
    url: '/signup',
    template: require('text!./employer-signup.html'),
    controller: 'EmployerSignupCtrl',
    controllerAs: 'signup',
  };
});
