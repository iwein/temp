define(function(require) {
  'use strict';
  require('angular-sanitize');
  require('components/directive-offer/directive-offer');
  var fn = require('tools/fn');
  var module = require('app-module');

  // jshint maxparams:8
  module.controller('OfferCtrl', function($scope, $sce, $state, toaster, Loader, ConfigAPI, Permission, Session) {
    $scope.toggleForm = toggleForm;
    $scope.accept = accept;
    $scope.reject = reject;
    $scope.sign = sign;
    $scope.ready = false;
    Loader.page(true);
    var email;

    Permission.requireActivated().then(function() {
      $scope.id = $state.params.id;

      ConfigAPI.rejectReasons().then(fn.setTo('rejectReasons', $scope));
      Session.getUser()
        .then(fn.invoke('getData', []))
        .then(function(data) { email = data.email });

      return Session.user.getOffer($scope.id);
    }).then(function(offer) {
      return offer.getTimeline().then(function(timeline) {
        return [ offer, timeline ];
      });
    }).then(function(data) {
      this.onStatusChange = onStatusChange;
      $scope.ready = true;
      $scope.offer = data[0];
      $scope.timeline = data[1];

      $scope.offer.setDataParser(function(data) {
        data.interview_details = $sce.trustAsHtml(data.interview_details);
        data.job_description = $sce.trustAsHtml(data.job_description);
      });

    }.bind(this)).finally(function() {
      Loader.page(false);
    });


    function onStatusChange() {
      toaster.success('Offer ' + $scope.offer.statusText);
    }

    function toggleForm(id) {
      $scope.showForm = $scope.showForm === id ? '' : id;
      $scope.acceptance = { email: email };
      $scope.rejection = {};
      $scope.signing = {};
    }

    function accept(offer, form) {
      Loader.add('offer-accept');
      offer.accept(form)
        .then(toggleForm.bind(null, 'accept'))
        .finally(function() { Loader.remove('offer-accept') });
    }

    function reject(offer, form) {
      Loader.add('offer-reject');
      offer.reject(form)
        .then(toggleForm.bind(null, 'reject'))
        .finally(function() { Loader.remove('offer-reject') });
    }

    function sign(offer, form) {
      Loader.add('offer-sign');
      offer.sign(form)
        .then(toggleForm.bind(null, 'sign'))
        .finally(function() { Loader.remove('offer-sign') });
    }
  });


  return {
    url: '/offer/:id',
    template: require('text!./candidate-offer.html'),
    controller: 'OfferCtrl',
    controllerAs: 'offerDetail',
  };
});
