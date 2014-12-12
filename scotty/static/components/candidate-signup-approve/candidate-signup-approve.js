define(function(require) {
  'use strict';
  var module = require('app-module');

  module.controller('CandidateSignupApproveCtrl', function($scope, $state, Session) {
    $scope.ready = false;
    if (Session.isSignupComplete) $state.go('profile');
  });

  return {
    url: '/approve/',
    template: require('text!./candidate-signup-approve.html'),
    controller: 'CandidateSignupApproveCtrl',
  };
});
