define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');


  module.controller('DashboardCtrl', function($scope, $q, $state, toaster, Session) {
    Session.checkSession().then(function() {
      if (!Session.hasSession()) {
        $state.go('login');
        return;
      }

      return $q.all([
        Session.isSignupComplete(),
        Session.getCandidates(),
        Session.getOffers(),
      ]);
    }).then(function(results) {
      if (!results[0])
        $state.go('signup');

      $scope.candidates = results[1];
      $scope.offers = results[2];
    }).catch(function() {
      toaster.defaultError();
    });
  });


  return {
    url: '/dashboard/',
    template: require('text!./employer-dashboard.html'),
    controller: 'DashboardCtrl',
    controllerAs: 'dashboard',
  };
});
