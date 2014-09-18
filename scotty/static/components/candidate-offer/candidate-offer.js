define(function(require) {
  'use strict';
  require('angular-sanitize');
  var module = require('app-module');

  // jshint maxparams:7
  module.controller('OfferCtrl', function($scope, $sce, $state, toaster, ConfigAPI, Permission, Session) {
    this.toggleRejecting = toggleRejecting;
    $scope.ready = false;

    Permission.requireLogged().then(function() {
      $scope.id = $state.params.id;

      ConfigAPI.rejectReasons().then(function(reasons) {
        $scope.rejectReasons = reasons;
      });

      return Session.user.getOffer($scope.id);
    }).then(function(offer) {
      $scope.offer = offer;
      offer.interview_details = $sce.trustAsHtml(offer.interview_details);
      offer.job_description = $sce.trustAsHtml(offer.job_description);
      $scope.ready = true;
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
