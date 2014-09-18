define(function(require) {
  'use strict';
  require('components/directive-candidate/directive-candidate');
  var module = require('app-module');


  module.controller('DashboardCtrl', function($scope, $sce, toaster, Permission, Session) {
    $scope.ready = false;
    Permission.requireSignup().then(function() {
      $scope.ready = true;

      Session.user.getCandidates().then(function(result) {
        $scope.candidates = result;
      });

      Session.user.getOffers().then(function(offers) {
        $scope.offers = offers.map(function(offer) {
          offer.candidateName = offer.candidate.first_name + ' ' + offer.candidate.last_name;
          offer.interview_details = $sce.trustAsHtml(offer.interview_details);
          offer.job_description = $sce.trustAsHtml(offer.job_description);
          offer.created = new Date(offer.created);
          return offer;
        });
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
