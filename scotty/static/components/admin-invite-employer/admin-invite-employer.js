define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('AdminInviteEmployerCtrl', function($scope, Session) {
    this.submit = submit;
    $scope.sent = false;
    $scope.loading = false;
    $scope.model = {};

    function submit() {
      $scope.loading = true;
      $scope.error = false;
      $scope.sent = false;

      Session.inviteEmployer($scope.model).then(function() {
        $scope.formInviteEmployer.$setPristine();
        $scope.sent = $scope.model.email;
        $scope.model = {};
      }).catch(function(request) {
        if (request.status === 409)
          $scope.errorAlreadyRegistered = true;
        else
          $scope.error = true;
      }).finally(function() {
        $scope.loading = false;
      });
    }
  });

  return {
    url: '/invite-employer/',
    template: require('text!./admin-invite-employer.html'),
    controller: 'AdminInviteEmployerCtrl',
    controllerAs: 'inviteEmployer',
  };
});
