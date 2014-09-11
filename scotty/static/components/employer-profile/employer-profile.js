define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('ProfileCtrl', function($scope, $state, Session) {
    $scope.ready = false;

    Session.getUserData().then(function(data) {
      if (!Session.hasSession()) {
        $state.go('login');
        return;
      }

      if (data.status === 'SIGNEDUP') {
        $state.go('signedup');
        return;
      }

      $scope.ready = true;
      $scope.data = data;
    });
  });


  return {
    url: '/profile/',
    template: require('text!./employer-profile.html'),
    controller: 'ProfileCtrl',
    controllerAs: 'profile',
  };
});
