define(function(require) {
  'use strict';
  require('components/directive-offer/directive-offer');
  var module = require('app-module');


  module.controller('DashboardCtrl', function($scope, $sce, toaster, Loader, Session) {
    this.refresh = list;
    $scope.loadMore = loadMore;
    $scope.filter = filter;
    $scope.query = {};
    var show = 15;
    var page = 1;
    var all, filtered;

    $scope.statuses = {
      'ACTIVE': 'Active',
      'REJECTED': 'Rejected',
      'ACCEPTED': 'Accept',
      'INTERVIEW': 'Interview',
      'CONTRACT_NEGOTIATION': 'Contract negotiation',
      'CONTRACT_SIGNED': 'Contract signed',
      'WITHDRAWN': 'Withdrawn',
      'EXPIRED': 'Expired',
    };

    list().finally(function() {
      Loader.page(false);
    });

    function filter() {
      var term = $scope.query.company ? $scope.query.company.toUpperCase() : '';
      filtered = all.filter(function(offer) {
        if ($scope.query.status && offer.status !== $scope.query.status)
          return false;

        if (!term)
          return true;

        var company = offer.data.employer.company_name.toUpperCase();
        return company.indexOf(term) !== -1;
      });

      page = 1;
      render();
    }

    function loadMore() {
      page++;
      render();
    }

    function render() {
      $scope.offers = filtered.slice(0, page * show);
    }

    function list() {
      Loader.add('admin-dashboard-offers');
      return Session.getOffers()
        .then(function(allOffers) {
          allOffers.forEach(function(offer) {
            offer.setDataParser(function(data) {
              data.interview_details = $sce.trustAsHtml(data.interview_details);
              data.job_description = $sce.trustAsHtml(data.job_description);
            });
          });

          all = allOffers;
          filter();
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
