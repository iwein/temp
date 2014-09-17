define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');


  module.controller('DashboardCtrl', function($scope, $q, $state, toaster, Session) {
    Session.checkSession().then(function() {
      if (!Session.hasSession()) {
        toaster.error('You need to log in to access this page');
        $state.go('login');
        return;
      }

      return $q.all([
        Session.isSignupComplete(),
        //Session.getOffers(),
      ]).then(function(results) {
        if (!results[0])
          $state.go('signup');
        $scope.offers = results[2];
      });
    }).catch(function() {
      toaster.defaultError();
    });
  });


  return {
    url: '/dashboard/',
    template: require('text!./candidate-dashboard.html'),
    controller: 'DashboardCtrl',
    controllerAs: 'dashboard',
  };
});
