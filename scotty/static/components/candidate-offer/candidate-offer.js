define(function(require) {
  'use strict';
  require('angular-sanitize');
  require('components/directive-offer/directive-offer');
  var module = require('app-module');

  // jshint maxparams:8
  module.controller('OfferCtrl', function($scope, $sce, $state, toaster, Loader, ConfigAPI, Permission, Session) {
    $scope.ready = false;
    Loader.page(true);

    Permission.requireActivated().then(function() {
      $scope.id = $state.params.id;

      ConfigAPI.rejectReasons().then(function(reasons) {
        $scope.rejectReasons = reasons;
      });

      return Session.user.getOffer($scope.id);
    }).then(function(offer) {
      this.onStatusChange = onStatusChange;
      $scope.ready = true;
      $scope.offer = offer;

      offer.setDataParser(function(data) {
        data.interview_details = $sce.trustAsHtml(data.interview_details);
        data.job_description = $sce.trustAsHtml(data.job_description);
      });

      function onStatusChange() {
        toaster.success('Offer ' + offer.statusText);
      }
    }.bind(this)).finally(function() {
      Loader.page(false);
    });
  });


  return {
    url: '/offer/:id',
    template: require('text!./candidate-offer.html'),
    controller: 'OfferCtrl',
    controllerAs: 'offerDetail',
  };
});
