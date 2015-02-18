define(function(require) {
  'use strict';
  require('session');
  require('tools/config-api');
  var fn = require('tools/fn');
  var Date = require('tools/date');
  var module = require('app-module');

  module.controller('InviteCodeCtrl', function($scope, toaster, ConfigAPI, Loader, Session) {
    $scope.submit = submit;
    Loader.page(true);
    list();

    function list() {
      Session.getInviteCodes()
        .then(function(result) {
          return result.sort(function(a, b) {
            var aCreated = Date.parse(a.created);
            var bCreated = Date.parse(b.created);
            return bCreated - aCreated;
          });
        })
        .then(fn.setTo('vauchers', $scope))
        .finally(function() { Loader.page(false) });
    }

    function submit() {
      Loader.add('admin-invite-code');

      return Session.addInviteCode($scope.model).then(function() {
        $scope.formInviteCode.$setPristine();
        $scope.model = {};
        return list();
      }).catch(function(error) {
        if (error.message === 'DUPLICATED_ENTRY')
          toaster.error('Code already created.');
        else
          toaster.defaultError();
      }).finally(function() {
        Loader.remove('admin-invite-code');
      });
    }
  });

  return {
    url: '/invite-code/',
    template: require('text!./admin-invite-code.html'),
    controller: 'InviteCodeCtrl',
  };
});
