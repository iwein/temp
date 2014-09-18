define(function(require) {
  'use strict';
  require('angular-sanitize');
  var module = require('app-module');

  module.controller('ProfileCtrl', function($scope, $sce, $state, Permission, Session) {
    $scope.ready = false;
    Permission.requireSignup().then(function() {
      return Session.user.getData();
    }).then(function(data) {
      $scope.ready = true;

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
