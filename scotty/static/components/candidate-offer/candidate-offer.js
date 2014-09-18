define(function(require) {
  'use strict';
  require('angular-sanitize');
  var module = require('app-module');

  module.controller('OfferCtrl', function($scope, $sce, $state, toaster, Permission, Session) {
    this.toggleRejecting = toggleRejecting;
    $scope.ready = false;

    Permission.requireLogged().then(function() {
      $scope.id = $state.params.id;
      return Session.user.getOffer($scope.id);
    }).then(function(offer) {
      $scope.offer = offer;
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
