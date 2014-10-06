define(function(require) {
  'use strict';
  require('angular-sanitize');
  require('components/directive-offer/directive-offer');
  var module = require('app-module');

  // jshint maxparams:7
  module.controller('OfferCtrl', function($scope, $sce, $state, toaster, ConfigAPI, Loader, Session) {
    this.toggleRejecting = toggleRejecting;
    $scope.loading = false;
    $scope.ready = false;
    $scope.model = {};
    $scope.id = $state.params.id;
    Loader.page(true);

    ConfigAPI.rejectReasons().then(function(reasons) {
      $scope.rejectReasons = reasons;
    });

    Session.getOffer($scope.id).then(function(offer) {
      this.onStatusChange = onStatusChange;
      this.reject = reject;
      this.accept = accept;
      $scope.ready = true;
      $scope.offer = offer;
      Loader.page(false);

      offer.setDataParser(function(data) {
        data.interview_details = $sce.trustAsHtml(data.interview_details);
        data.job_description = $sce.trustAsHtml(data.job_description);
      });

      function onStatusChange() {
        toaster.success('Offer ' + offer.statusText);
      }

      function accept() {
        Loader.add('admin-offer-accept');
        offer.accept($scope.model)
          .then(function() { toaster.success('Offer accepted') })
          .catch(toaster.defaultError)
          .finally(function() { Loader.remove('admin-offer-accept') });
      }

      function reject() {
        if (!$scope.model.reason)
          return;

        Loader.add('admin-offer-reject');
        offer.reject($scope.model)
          .then(function() {
            $scope.rejecting = false;
            toaster.success('Offer rejected');
          })
          .catch(toaster.defaultError)
          .finally(function() { Loader.remove('admin-offer-reject') });
      }

    }.bind(this));

    function toggleRejecting() {
      $scope.rejecting = !$scope.rejecting;
    }
  });


  return {
    url: '/offer/:id',
    template: require('text!./admin-offer.html'),
    controller: 'OfferCtrl',
    controllerAs: 'offerDetail',
  };
});
