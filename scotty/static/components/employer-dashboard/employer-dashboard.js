define(function(require) {
  'use strict';
  require('components/directive-candidate/directive-candidate');
  var module = require('app-module');


  module.controller('DashboardCtrl', function($scope, $q, $state, toaster, Permission, Session) {
    $scope.ready = false;
    Permission.requireSignup().then(function() {
      $scope.ready = true;

      Session.user.getCandidates().then(function(result) {
        $scope.candidates = result;
      });

      Session.user.getOffers().then(function(offers) {
        $scope.offers = offers;
      }).catch(function() {
        toaster.error('Offers not implemented');
      });
    });
  });


  return {
    url: '/dashboard/',
    template: require('text!./employer-dashboard.html'),
    controller: 'DashboardCtrl',
    controllerAs: 'dashboard',
  };
});
