define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('SignupStartCtrl', function($scope, $q, $state, Session) {
    this.submit = submit;
    $scope.invited = false;
    $scope.loading = true;
    $scope.model = {};
    var token = $state.params.token;

    $q.when(token).then(function(token) {
      if (!token) return;
      return Session.getInvitationData(token);
    }).then(function(data) {
      if (!data) return;
      $scope.invited = true;
      $scope.model = {
        contact_name: data.contact_name,
        company_name: data.company_name,
        email: data.email,
        token: token,
      };
    }, function() {
      $scope.invitationFailed = true;
    }).finally(function() {
      $scope.loading = false;
    });

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
    url: '/start/:token',
    template: require('text!./employer-signup-start.html'),
    controller: 'SignupStartCtrl',
    controllerAs: 'signupStart',
  };
});


