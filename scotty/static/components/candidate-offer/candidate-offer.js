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
      this.accept = acceptOffer;
      this.reject = rejectOffer;
      $scope.ready = true;
      $scope.offer = offer;
      $scope.active = offer.status === 'ACTIVE';
      offer.interview_details = $sce.trustAsHtml(offer.interview_details);
      offer.job_description = $sce.trustAsHtml(offer.job_description);

      function acceptOffer() {
        $scope.loading = true;
        Session.user.acceptOffer($scope.id)
          .then(function() {
            toaster.success('Offer accepted');
            $scope.active = false;
          })
          .catch(toaster.defaultError)
          .finally(function() { $scope.loading = false });
      }

      function rejectOffer() {
        if (!$scope.model.reason)
          return;

        $scope.loading = true;
        Session.user.rejectOffer($scope.id, $scope.model)
          .then(function() {
            toaster.success('Offer rejected');
            $scope.active = false;
          })
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
