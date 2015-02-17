define(function(require) {
  'use strict';
  require('angular-sanitize');
  require('components/directive-offer/directive-offer');
  require('components/partial-benefits/partial-benefits');
  require('components/partial-offer-newsitem/partial-offer-newsitem');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');

  // jshint maxparams:9
  module.controller('OfferCtrl', function($scope, $sce, toaster, i18n,
                                          Loader, ConfigAPI, Session, RequireSignup, offer) {
    _.extend($scope, {
      toggleForm: toggleForm,
      accept: accept,
      reject: reject,
      sign: sign,
      flags: {},
      ready: false,
    });
    this.onStatusChange = onStatusChange;
    var email;

    return onLoad();


    function onLoad() {
      Loader.page(true);
      ConfigAPI.rejectReasons().then(fn.setTo('rejectReasons', $scope));

      return Session.getUser().then(function(candidate) {
        email = candidate._data.email;
        setHired(candidate._data);
        return offer.getTimeline();
      }).then(function(timeline) {
        configureOffer(offer);
        _.extend($scope, {
          timeline: timeline,
          ready: true,
        });
      }).finally(function() {
        Loader.page(false);
      });
    }

    function setHired(data) {
      var hired = $scope.has_been_hired = data.candidate_has_been_hired;
      if (hired) {
        toaster.success(offer.status === 'CONTRACT_SIGNED' ?
          i18n.gettext('You have already accepted this offer!') :
          i18n.gettext('You have already accepted another offer!'),
          { untilStateChange: true });
      }
    }

    function configureOffer(offer) {
      var getNextStatusText = offer.getNextStatusText;
      offer.getNextStatusText = function() {
        return i18n.gettext(getNextStatusText.apply(this, arguments));
      };
      offer.setDataParser(function(data) {
        data.message = $sce.trustAsHtml(data.message);
        data.interview_details = $sce.trustAsHtml(data.interview_details);
        data.job_description = $sce.trustAsHtml(data.job_description);
        data.statusText = i18n.gettext(data.statusText);
      });
      $scope.offer = offer;
    }

    function onStatusChange() {
      toaster.success(i18n.gettext('Offer {{ status }}', {
        status: i18n.gettext($scope.offer.statusText),
      }));
    }

    function toggleForm(id) {
      _.extend($scope, {
        showForm: $scope.showForm === id ? '' : id,
        acceptance: { email: email },
        rejection: {},
        signing: {},
      });
    }

    function accept(offer, form) {
      Loader.add('offer-accept');
      return offer.accept(form)
        .then(toggleForm.bind(null, 'accept'))
        .finally(function() { Loader.remove('offer-accept') });
    }

    function reject(offer, form) {
      Loader.add('offer-reject');
      return offer.reject(form)
        .then(toggleForm.bind(null, 'reject'))
        .finally(function() { Loader.remove('offer-reject') });
    }

    function sign(offer, form) {
      Loader.add('offer-sign');
      return offer.sign(form)
        .then(toggleForm.bind(null, 'sign'))
        .finally(function() {
          toaster.success(
            i18n.gettext('<h2>Congratulation to your new position!</h2>\nYour profile will be on sleep!'),
            { untilStateChange: true, html: true }
          );
          Loader.remove('offer-sign');
        });
    }
  });


  return {
    url: '/offer/:id',
    template: require('text!./candidate-offer.html'),
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
