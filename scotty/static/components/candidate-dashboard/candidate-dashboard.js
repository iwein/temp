define(function(require) {
  'use strict';
  require('components/directive-employer/directive-employer');
  var module = require('app-module');


  module.controller('DashboardCtrl', function($scope, $sce, toaster, Permission, Session) {
    $scope.ready = false;
    Permission.requireSignup().then(function() {
      $scope.ready = true;
      return Session.getUser();
    }).then(function(user) {
      user.getBookmarks().then(function(employers) {
        $scope.employers = employers;
      });

      user.getOffers().then(function(offers) {
        $scope.offers = offers.map(function(offer) {
          offer.interview_details = $sce.trustAsHtml(offer.interview_details);
          offer.job_description = $sce.trustAsHtml(offer.job_description);
          return offer;
        });
      });
    }).catch(toaster.defaultError);
  });


  return {
    url: '/dashboard/',
    template: require('text!./candidate-dashboard.html'),
    controller: 'DashboardCtrl',
    controllerAs: 'dashboard',
  };
});
