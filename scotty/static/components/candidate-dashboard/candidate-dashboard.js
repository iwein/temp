define(function(require) {
  'use strict';
  require('components/directive-employer/directive-employer');
  require('components/directive-offer/directive-offer');
  var module = require('app-module');


  // jshint maxparams:7
  module.controller('DashboardCtrl', function($scope, $q, $sce, toaster, Loader, Permission, Session) {
    Loader.page(true);
    $scope.ready = false;

    Permission.requireSignup().then(function() {
      $scope.ready = true;
      return Session.getUser();
    }).then(function(user) {
      return user.getOffers();
    }).then(function(results) {
      $scope.offers = results.map(function(offer) {
        offer.setDataParser(function(data) {
          data.interview_details = $sce.trustAsHtml(data.interview_details);
          data.job_description = $sce.trustAsHtml(data.job_description);
        });
        return offer;
      });
    }).finally(function() {
      Loader.page(false);
    });
  });


  return {
    url: '/dashboard/',
    template: require('text!./candidate-dashboard.html'),
    controller: 'DashboardCtrl',
    controllerAs: 'dashboard',
  };
});
