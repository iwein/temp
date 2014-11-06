define(function(require) {
  'use strict';
  require('angular-sanitize');
  require('components/directive-offer/directive-offer');
  var module = require('app-module');

  // jshint maxparams:8
  module.controller('OfferCtrl', function($scope, $sce, $state, toaster, Loader, Permission, Session) {
    $scope.ready = false;
    Loader.page(true);
    var self = this;

    Permission.requireLogged().then(function() {
      $scope.id = $state.params.id;
      return Session.getUser().then(function(user) {
        return user.getOffer($scope.id);
      }).then(function(offer) {
        return offer.getTimeline().then(function(timeline) {
          return [ offer, timeline ];
        });
      }).then(function(data) {
        var offer = data[0];

        offer.setDataParser(function(data) {
          data.interview_details = $sce.trustAsHtml(data.interview_details);
          data.job_description = $sce.trustAsHtml(data.job_description);
          data.message = $sce.trustAsHtml(data.message);
        });

        return Session.getCandidate(offer.data.candidate_id).then(function(candidate) {
          return candidate.getTargetPosition();
        }).then(function(targetPosition) {
          return [ offer, data[1], targetPosition ];
        });
      }).then(function(result) {
        self.onStatusChange = onStatusChange;
        $scope.ready = true;
        $scope.offer = result[0];
        $scope.timeline = result[1];
        $scope.targetPosition = result[2];
      });
    }).finally(function() {
      Loader.page(false);
    });

    function onStatusChange() {
      toaster.success('Offer ' + $scope.offer.statusText);
    }
  });


  return {
    url: '/offer/:id',
    template: require('text!./employer-offer.html'),
    controller: 'OfferCtrl',
    controllerAs: 'offerDetail',
  };
});
