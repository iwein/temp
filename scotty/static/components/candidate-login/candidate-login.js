define(function(require) {
  'use strict';
  require('tools/candidate-session');
  var module = require('app-module');

  module.controller('CandidateLoginCtrl', function(
    $scope,
    $location,
    CandidateSession
  ) {
    $scope.error = false;
    $scope.loading = false;
    $scope.submit = submit;

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
});
