define(function(require) {
  'use strict';
  require('angular-sanitize');
  var module = require('app-module');

  // jshint maxparams:7
  module.controller('OfferCtrl', function($scope, $sce, $state, toaster, ConfigAPI, Permission, Session) {
    this.toggleRejecting = toggleRejecting;
    $scope.loading = false;
    $scope.ready = false;
    $scope.model = {};

    Permission.requireLogged().then(function() {
      $scope.id = $state.params.id;

      ConfigAPI.rejectReasons().then(function(reasons) {
        $scope.rejectReasons = reasons;
      });

      return Session.user.getOffer($scope.id);
    }).then(function(offer) {
      this.onStatusChange = onStatusChange;
      this.reject = reject;
      this.accept = accept;
      $scope.ready = true;
      $scope.offer = offer;

      offer.setDataParser(function(data) {
        data.interview_details = $sce.trustAsHtml(data.interview_details);
        data.job_description = $sce.trustAsHtml(data.job_description);
      });

      function onStatusChange() {
        toaster.success('Offer ' + offer.statusText);
      }

      function accept() {
        $scope.loading = true;
        offer.reject($scope.model)
          .then(function() { toaster.success('Offer accepted') })
          .catch(toaster.defaultError)
          .finally(function() { $scope.loading = false });
      }

      function reject() {
        if (!$scope.model.reason)
          return;

        $scope.loading = true;
        offer.reject($scope.model)
          .then(function() { toaster.success('Offer rejected') })
          .catch(toaster.defaultError)
          .finally(function() { $scope.loading = false });
      }

    }.bind(this));

    function toggleRejecting() {
      $scope.rejecting = !$scope.rejecting;
    }
  });


  return {
    url: '/offer/:id',
    template: require('text!./candidate-offer.html'),
    controller: 'OfferCtrl',
    controllerAs: 'offerDetail',
  };
});
