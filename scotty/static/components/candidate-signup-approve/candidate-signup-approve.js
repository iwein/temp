define(function(require) {
  'use strict';
  var module = require('app-module');


  module.controller('CandidateSignupApproveCtrl', function($scope, $state, Session) {
    $scope.ready = false;
    Session.isSignupComplete().then(function(approved) {
      if (approved)
        $state.go('profile');
    }).finally(function() {
      $scope.ready = true;
    });
  });


  return {
    url: '/approve/',
    template: require('text!./candidate-signup-approve.html'),
    controller: 'CandidateSignupApproveCtrl',
  };
});
