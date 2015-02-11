define(function(require) {
  'use strict';
  require('angular-sanitize');
  require('components/directive-offer/directive-offer');
  require('components/partial-benefits/partial-benefits');
  require('components/partial-offer-newsitem/partial-offer-newsitem');
  require('components/partial-candidate-pic/partial-candidate-pic');
  var fn = require('tools/fn');
  var module = require('app-module');

  // jshint maxparams:9
  module.controller('OfferCtrl', function($scope, $sce, $state, toaster, i18n,
                                          Loader, ConfigAPI, Permission, Session) {
    $scope.toggleForm = toggleForm;
    $scope.withdraw = withdraw;
    $scope.sign = sign;
    $scope.ready = false;
    Loader.page(true);
    var self = this;
    var statuses = [
      'ACCEPTED',
      'INTERVIEW',
      'CONTRACT_NEGOTIATION',
      'CONTRACT_SIGNED',
    ];

    Permission.requireSignup().then(function() {
      $scope.id = $state.params.id;
      ConfigAPI.withdrawReasons().then(fn.setTo('withdrawReasons', $scope));

      return Session.getUser().then(function(user) {
        return user.getOffer($scope.id);
      }).then(function(offer) {
        return offer.getTimeline().then(function(timeline) {
          return [ offer, timeline ];
        });
      }).then(function(data) {
        var offer = data[0];
        var getNextStatusText = offer.getNextStatusText;
        offer.getNextStatusText = function() {
          i18n.gettext(getNextStatusText.apply(this, arguments));
        };

        offer.setDataParser(function(data) {
          data.interview_details = $sce.trustAsHtml(data.interview_details);
          data.job_description = $sce.trustAsHtml(data.job_description);
          data.message = $sce.trustAsHtml(data.message);
          data.accepted = statuses.indexOf(data.status) !== -1;
          data.statusText = i18n.gettext(data.statusText);
        });

        return Session.getCandidate(offer.data.candidate.id).then(function(candidate) {
          $scope.candidate = candidate;
          return candidate.getLastPosition();
        }).then(function(position) {
          return [ offer, data[1], position ];
        });
      }).then(function(result) {
        self.onStatusChange = onStatusChange;
        $scope.ready = true;
        $scope.offer = result[0];
        $scope.timeline = result[1];
        $scope.candidatePosition = result[2];
      });
    }).finally(function() {
      Loader.page(false);
    });

    function onStatusChange() {
      toaster.success(i18n.gettext('Offer {{ status }}', {
        status: $scope.offer.statusText,
      }));
    }

    function toggleForm(id) {
      $scope.showForm = $scope.showForm === id ? '' : id;
      $scope.withdrawal = {};
      $scope.signing = {};
    }

    function sign(offer, form) {
      Loader.add('offer-sign');
      offer.sign(form)
        .then(toggleForm.bind(null, 'sign'))
        .finally(function() { Loader.remove('offer-sign') });
    }

    function withdraw(offer, form) {
      Loader.add('offer-withdraw');
      offer.withdraw(form)
        .then(toggleForm.bind(null, 'withdraw'))
        .finally(function() { Loader.remove('offer-withdraw') });
    }
  });


  return {
    url: '/offer/:id',
    template: require('text!./employer-offer.html'),
    controller: 'OfferCtrl',
    controllerAs: 'offerDetail'
  };
});
