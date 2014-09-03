define(function(require) {
  'use strict';
  require('tools/candidate-session');
  var module = require('app-module');

  module.controller('CandidateLoginCtrl', function(
    $scope,
    $location,
    CandidateSession
  ) {
    this.submit = submit;
    $scope.error = false;
    $scope.loading = false;

    function submit(email, password) {
      $scope.error = false;
      $scope.loading = true;

      CandidateSession.login(email, password).then(function() {
        $scope.loading = false;
        $location.path('/');
      }, function() {
        $scope.error = true;
        $scope.loading = false;
      });
    }
  });


  return {
    url: '/login',
    template: require('text!./candidate-login.html'),
    controller: 'CandidateLoginCtrl',
    controllerAs: 'login',
  };
});
