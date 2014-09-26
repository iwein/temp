define(function(require) {
  'use strict';
  var module = require('app-module');
  var stateText = {
    'ACTIVE': 'Active',
    'REJECTED': 'Rejected',
    'ACCEPTED': 'Accept',
    'INTERVIEW': 'Interview',
    'CONTRACT_SENT': 'Contract sent',
    'CONTRACT_RECEIVED': 'Contract received',
    'CONTRACT_SIGNED': 'Contract signed',
    'JOB_STARTED': 'Job starte',
  };


  module.controller('DashboardCtrl', function($scope, $q, $sce, toaster, Session) {
    this.nextStatus = nextStatus;
    this.refresh = list;
    $scope.stateText = stateText;

    list();

    function list() {
      Session.getOffers().then(function(offers) {
        return $q.all(offers.map(function(offer) {
          return offer.getData().then(function(data) {
            data.interview_details = $sce.trustAsHtml(data.interview_details);
            data.job_description = $sce.trustAsHtml(data.job_description);
            offer.data = data;
            return offer;
          });
        }));
      }).then(function(offers) {
        $scope.offers = offers;
      }).catch(toaster.defaultError);
    }

    function nextStatus(offer) {
      offer.nextStatus().catch(toaster.defaultError);
    }
  });

  return {
    url: '/dashboard/',
    template: require('text!./admin-dashboard.html'),
    controller: 'DashboardCtrl',
    controllerAs: 'dashboard',
  };
});
