define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('AdminInviteEmployerCtrl', function($scope, toaster, Session) {
    this.submit = submit;
    $scope.loading = false;
    $scope.model = {};

    function submit() {
      $scope.loading = true;

      Session.inviteEmployer($scope.model).then(function() {
        $scope.formInviteEmployer.$setPristine();
        toaster.success('Email was sent to ' + $scope.model.email);
        $scope.model = {};
      }).catch(function(request) {
        if (request.status === 409)
          toaster.error('Email address already registered.');
        else
          toaster.defaultError();
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
