define(function(require) {
  'use strict';
  require('angular-sanitize');
  require('components/directive-offer/directive-offer');
  var fn = require('tools/fn');
  var module = require('app-module');

  // jshint maxparams:8
  module.controller('OfferCtrl', function($scope, $sce, $state, toaster, Loader, ConfigAPI, Session) {
    $scope.getTimelineText = getTimelineText;
    $scope.toggleForm = toggleForm;
    $scope.accept = accept;
    $scope.reject = reject;
    $scope.withdraw = withdraw;
    $scope.sign = sign;
    $scope.ready = false;
    $scope.id = $state.params.id;
    Loader.page(true);
    var email;

    ConfigAPI.rejectReasons().then(fn.setTo('rejectReasons', $scope));
    ConfigAPI.withdrawReasons().then(fn.setTo('withdrawReasons', $scope));

    Session.getOffer($scope.id).then(function(offer) {
      return [ offer ];
      /*
      return offer.getTimeline().then(function(timeline) {
        return [ offer, timeline ];
      });
      */
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
      $scope.withdrawal = {};
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

    function withdraw(offer, form) {
      Loader.add('offer-withdraw');
      offer.withdraw(form)
        .then(toggleForm.bind(null, 'withdraw'))
        .finally(function() { Loader.remove('offer-withdraw') });
    }

    function sign(offer, form) {
      Loader.add('offer-sign');
      offer.sign(form)
        .then(toggleForm.bind(null, 'sign'))
        .finally(function() { Loader.remove('offer-sign') });
    }

    function getTimelineText(name, offer) {
      var company = offer.data.employer.company_name;

      return {
        REJECTED: 'You have turned down the offer',
        WITHDRAWN: company + ' had turned down the offer',
        OFFER_MADE: 'Awesome, you received an offer from ' + company,
        ACCEPTED: 'Brilliant you have accepted an interview with ' + company,
        INTERVIEWING: 'Great! you have started interviewing with ' + company,
        NEGOCIATING: 'Nearly there, you have started negotiating the details with ' + company,
        CONTRACT_SIGNED: 'Winning! you have signed a contract with ' + company +
          ' and will receive your golden handshake soon',
      }[name];
    }
  });


  return {
    url: '/offer/:id',
    template: require('text!./admin-offer.html'),
    controller: 'OfferCtrl',
    controllerAs: 'offerDetail',
  };
});
