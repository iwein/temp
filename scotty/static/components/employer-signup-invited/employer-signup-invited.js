define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('SignupInvited', function($scope, $state, Session) {
    $scope.signup.invited = false;
    $scope.signup.invitedData = null;
    $scope.signup.invitationFailed = false;

    Session.getInvitationData($state.params.token).then(function(data) {
      $scope.signup.invited = true;
      $scope.signup.invitedData = data;
    }, function() {
      $scope.signup.invitationFailed = true;
    }).finally(function() {
      $state.go('^.basic');
    });
  });

  return {
    url: '/invited/:token',
    template: require('text!./employer-signup-invited.html'),
    controller: 'SignupInvited',
    controllerAs: 'signupInvited',
  };
});
