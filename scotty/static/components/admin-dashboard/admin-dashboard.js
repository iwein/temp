define(function(require) {
  'use strict';
  require('components/directive-offer/directive-offer');
  var module = require('app-module');


  module.controller('DashboardCtrl', function($scope, $q, $sce, toaster, Session) {
    this.refresh = list;

    list();

    function list() {
      Session.getOffers().then(function(offers) {
        $scope.offers = offers;

        offers.map(function(offer) {
          offer.setDataParser(function(data) {
            data.interview_details = $sce.trustAsHtml(data.interview_details);
            data.job_description = $sce.trustAsHtml(data.job_description);
          });
        });
      }).catch(toaster.defaultError);
    }
  });

  return {
    url: '/dashboard/',
    template: require('text!./admin-dashboard.html'),
    controller: 'DashboardCtrl',
    controllerAs: 'dashboard',
  };
});
