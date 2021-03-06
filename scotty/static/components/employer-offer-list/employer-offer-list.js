define(function(require) {
  'use strict';
  require('components/directive-offer/directive-offer');
  var module = require('app-module');

  // jshint maxparams:9
  module.controller('OfferListCtrl', function($scope, $q, $sce, $state, toaster,
    Loader, ConfigAPI, Permission, Session) {

    Loader.page(true);
    Permission.requireSignup().then(function() {

      Session.getUser().then(function(user) {
        return user.getOffers();
      }).then(function(offers) {
        $scope.offers = offers.map(function(offer) {
          offer.setDataParser(function(data) {
            data.interview_details = $sce.trustAsHtml(data.interview_details);
            data.job_description = $sce.trustAsHtml(data.job_description);
          });
          return offer;
        });

        return $q.all(offers.map(function(offer) {
          return Session.getCandidate(offer.data.candidate.id).then(function(candidate) {
            return candidate.getLastPosition();
          }).then(function(position) {
            offer.position = position;
          });
        }));
      }).catch(function() {
        toaster.defaultError();
      }).finally(function() {
        Loader.page(false);
      });

    });
  });
  return {
    url: '/offers/',
    template: require('text!./employer-offer-list.html'),
    controller: 'OfferListCtrl',
    controllerAs: 'offerList',
  };
});
