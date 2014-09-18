define(function(require) {
  'use strict';
  require('angular-sanitize');
  require('session');
  var module = require('app-module');

  module.controller('ProfileCtrl', function($scope, $sce, $state, Session) {
    $scope.ready = false;

    Session.getUserData().then(function(data) {
      if (!Session.hasSession()) {
        $state.go('login');
        return;
      }

      if (data.status === 'SIGNEDUP') {
        $state.go('signup');
        return;
      }

      if (data.status === 'APPROVED')
        $scope.approved = true;

      $scope.ready = true;
      $scope.data = data;
      $scope.data.mission_text = $sce.trustAsHtml(data.mission_text);
    });
  });


  return {
    url: '/profile/',
    template: require('text!./employer-profile.html'),
    controller: 'ProfileCtrl',
    controllerAs: 'profile',
  };
});
