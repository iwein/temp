define(function(require) {
  'use strict';
  require('tools/candidate-session');
  var module = require('app-module');

  module.controller('CandidateLoginCtrl', function($scope, $state, CandidateSession) {
    this.submit = submit;
    $scope.error = false;
    $scope.loading = false;

    function isSignupComplete() {
      return CandidateSession.getSignupStage().then(function(stage) {
        return stage.ordering.every(function(item) {
          // TODO: remove this conditional when 'image' is implemented
          if (item === 'image')
            return true;
          return stage[item];
        });
      });
    }

    function submit(email, password) {
      $scope.error = false;
      $scope.loading = true;

      CandidateSession.login(email, password).then(function() {
        isSignupComplete().then(function(isComplete) {
          $scope.loading = false;
          $state.go(isComplete ? 'profile' : 'signup');
        });
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
