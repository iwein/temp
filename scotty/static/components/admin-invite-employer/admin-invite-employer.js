define(function(require) {
  'use strict';
  require('session');
  require('tools/config-api');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.controller('AdminInviteEmployerCtrl', function($scope, toaster, ConfigAPI, Loader, Session) {
    this.submit = submit;
    $scope.loading = false;
    $scope.model = {};
    Loader.page(true);

    ConfigAPI.salutations()
      .then(fn.setTo('salutations', $scope))
      .finally(function() { Loader.page(false) });

    function submit() {
      $scope.loading = true;
      Loader.add('admin-invite-employer');

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
        Loader.remove('admin-invite-employer');
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
