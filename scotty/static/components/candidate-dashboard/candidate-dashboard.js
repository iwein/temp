define(function(require) {
  'use strict';
  var module = require('app-module');


  module.controller('DashboardCtrl', function($scope, toaster, Permission, Session) {
    $scope.ready = false;
    Permission.requireSignup().then(function() {
      $scope.ready = true;

      Session.user.getOffers().then(function(offers) {
        $scope.offers = offers;
      }).catch(function() {
        toaster.error('Offers not implemented');
      });
    });
  });


  return {
    url: '/dashboard/',
    template: require('text!./candidate-dashboard.html'),
    controller: 'DashboardCtrl',
    controllerAs: 'dashboard',
  };
});
