define(function(require) {
  'use strict';
  require('components/directive-candidate/directive-candidate');
  require('components/directive-offer/directive-offer');
  var module = require('app-module');


  module.controller('DashboardCtrl', function($scope, $sce, toaster, Permission, Session) {
    $scope.ready = false;
    Permission.requireSignup().then(function() {
      $scope.ready = true;
      return Session.getUser();
    }).then(function(user) {
      user.getCandidates().then(function(result) {
        $scope.candidates = result;
      });

      user.getOffers().then(function(offers) {
        $scope.offers = offers;

        offers.map(function(offer) {
          offer.setDataParser(function(data) {
            data.interview_details = $sce.trustAsHtml(data.interview_details);
            data.job_description = $sce.trustAsHtml(data.job_description);
          });
        });
      });
    }).catch(toaster.defaultError);
  });


  return {
    url: '/dashboard/',
    template: require('text!./employer-dashboard.html'),
    controller: 'DashboardCtrl',
    controllerAs: 'dashboard',
  };
});
