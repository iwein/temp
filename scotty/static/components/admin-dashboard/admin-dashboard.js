define(function(require) {
  'use strict';
  require('components/directive-offer/directive-offer');
  var module = require('app-module');


  module.controller('DashboardCtrl', function($scope, $sce, toaster, Loader, Session) {
    this.refresh = list;

    list().finally(function() {
      Loader.page(false);
    });

    function list() {
      Loader.add('admin-dashboard-offers');
      return Session.getOffers()
        .then(function(offers) {
          $scope.offers = offers;
          offers.map(function(offer) {
            offer.setDataParser(function(data) {
              data.interview_details = $sce.trustAsHtml(data.interview_details);
              data.job_description = $sce.trustAsHtml(data.job_description);
            });
          });
        })
        .catch(toaster.defaultError)
        .finally(function() { Loader.remove('admin-dashboard-offers') });
    }
  });

  return {
    url: '/dashboard/',
    template: require('text!./admin-dashboard.html'),
    controller: 'DashboardCtrl',
    controllerAs: 'dashboard',
  };
});
