define(function(require) {
  'use strict';
  require('angular-sanitize');
  require('components/directive-office/directive-office');
  var module = require('app-module');

  module.controller('ProfileCtrl', function($scope, $sce, $state, Loader, Permission, Session) {
    this.edit = function() { $scope.isEditing = true };
    this.stopEdit = function() { $scope.isEditing = false };
    $scope.ready = false;
    Loader.page(true);

    Permission.requireActivated().then(function() {
      return Session.getUser();
    }).then(function(user) {
      return user.getData();
    }).then(function(data) {
      $scope.ready = true;

      if (data.status === 'APPROVED')
        $scope.approved = true;

      $scope.ready = true;
      $scope.data = data;
      $scope.data.mission_text = $sce.trustAsHtml(data.mission_text);
    }).finally(function() {
      Loader.page(false);
    });
  });


  return {
    url: '/profile/',
    template: require('text!./employer-profile.html'),
    controller: 'ProfileCtrl',
    controllerAs: 'profile',
  };
});
