define(function(require) {
  'use strict';
  require('components/directive-offer/directive-offer');
  var module = require('app-module');

  // jshint maxparams:9
  module.controller('OfferListCtrl', function($scope, $sce, $state, toaster, i18n,
                                              Loader, ConfigAPI, Permission, Session) {
    Loader.page(true);

    Permission.requireLogged().then(function() {
      Session.refreshUser().then(function(user) {

        $scope.candidate_has_been_hired = user._data.candidate_has_been_hired;
        if($scope.candidate_has_been_hired){
          toaster.success(
            i18n.gettext('You have been hired, offer management is currently disabled.'),
            { untilStateChange: true }
          );
        }

        return user.getOffers();
      }).then(function(offers) {
        $scope.offers = offers.map(function(offer) {
          offer.setDataParser(function(data) {
            data.interview_details = $sce.trustAsHtml(data.interview_details);
            data.job_description = $sce.trustAsHtml(data.job_description);
          });
          return offer;
        });
      }).catch(function() {
        toaster.defaultError();
      }).finally(function() {
        Loader.page(false);
      });
    });
  });


  return {
    url: '/offers/',
    template: require('text!./candidate-offer-list.html'),
    controller: 'OfferListCtrl',
    controllerAs: 'offerList'
  };
});
