define(function(require) {
  'use strict';
  var module = require('app-module');

  module.controller('EmployerLoginCtrl', function($scope, $state, toaster, Loader, Session) {
    this.submit = submit;
    $scope.error = false;
    $scope.loading = false;

    function submit(email, password) {
      $scope.error = false;
      $scope.loading = true;
      Loader.add('employer-login');

      Session.login(email, password).then(function() {
        $state.go(Session.isSignupComplete ? 'dashboard' : 'signup');
      }).finally(function() {
        $scope.loading = false;
        Loader.remove('employer-login');
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
