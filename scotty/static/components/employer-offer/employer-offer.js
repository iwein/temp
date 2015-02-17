define(function(require) {
  'use strict';
  require('angular-sanitize');
  require('components/directive-offer/directive-offer');
  require('components/partial-benefits/partial-benefits');
  require('components/partial-offer-newsitem/partial-offer-newsitem');
  require('components/partial-candidate-pic/partial-candidate-pic');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');

  // jshint maxparams:10
  module.controller('OfferCtrl', function($scope, $q, $sce, toaster, i18n,
                                          Loader, ConfigAPI, Session, RequireSignup, offer) {
    _.extend($scope, {
      toggleForm: toggleForm,
      withdraw: withdraw,
      sign: sign,
      ready: false,
    });
    _.extend(this, {
      onStatusChange: onStatusChange,
    });

    var statuses = [
      'ACCEPTED',
      'INTERVIEW',
      'CONTRACT_NEGOTIATION',
      'CONTRACT_SIGNED',
    ];

    return onLoad();


    function onLoad() {
      Loader.page(true);
      configureOffer(offer);
      ConfigAPI.withdrawReasons().then(fn.setTo('withdrawReasons', $scope));

      return $q.all([
        offer.getTimeline().then(fn.setTo('timeline', $scope)),
        getCandidateData(),
      ])
      .then(function() { $scope.ready = true })
      .finally(function() { Loader.page(false) });
    }

    function configureOffer() {
      var getNextStatusText = offer.getNextStatusText;
      offer.getNextStatusText = function() {
        return i18n.gettext(getNextStatusText.apply(this, arguments));
      };
      offer.setDataParser(function(data) {
        data.interview_details = $sce.trustAsHtml(data.interview_details);
        data.job_description = $sce.trustAsHtml(data.job_description);
        data.message = $sce.trustAsHtml(data.message);
        data.accepted = statuses.indexOf(data.status) !== -1;
        data.statusText = i18n.gettext(data.statusText);
      });
      $scope.offer = offer;
    }

    function getCandidateData() {
      return Session.getCandidate(offer.data.candidate.id).then(function(candidate) {
        $scope.candidate = candidate;
        return candidate.getLastPosition()
          .then(fn.setTo('candidatePosition', $scope));
      });
    }

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
      return offer.sign(form)
        .then(toggleForm.bind(null, 'sign'))
        .finally(function() { Loader.remove('offer-sign') });
    }

    function withdraw(offer, form) {
      Loader.add('offer-withdraw');
      return offer.withdraw(form)
        .then(toggleForm.bind(null, 'withdraw'))
        .finally(function() { Loader.remove('offer-withdraw') });
    }
  });


  return {
    url: '/offer/:id',
    template: require('text!./employer-offer.html'),
    controller: 'OfferCtrl',
    controllerAs: 'offerDetail',
    resolve: {
      /*@ngInject*/
      RequireSignup: function(Permission) {
        return Permission.requireSignup();
      },
      /*@ngInject*/
      offer: function($stateParams, Session) {
        return Session.getUser().then(function(user) {
          return user.getOffer($stateParams.id);
        });
      },
    },
  };
});
