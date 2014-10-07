define(function(require) {
  'use strict';
  require('components/directive-candidate/directive-candidate');
  require('components/directive-offer/directive-offer');
  var module = require('app-module');


  // jshint maxparams:7
  module.controller('DashboardCtrl', function($scope, $q, $sce, toaster, Loader, Permission, Session) {
    $scope.ready = false;
    Loader.page(true);

    Permission.requireActivated().then(function() {
      $scope.ready = true;
      return Session.getUser();
    }).then(function(user) {
      return $q.all([
        user.getCandidates(),
        user.getOffers(),
      ]);
    }).then(function(results) {
      $scope.candidates = results[0];
      $scope.offers = results[1].map(function(offer) {
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
    template: require('text!./employer-dashboard.html'),
    controller: 'DashboardCtrl',
    controllerAs: 'dashboard',
  };
});
