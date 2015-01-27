define(function(require) {
  'use strict';
  require('angular-sanitize');
  require('components/directive-offer/directive-offer');
  require('components/partial-benefits/partial-benefits');
  require('components/partial-offer-newsitem/partial-offer-newsitem');
  var fn = require('tools/fn');
  var module = require('app-module');

  // jshint maxparams:9
  module.controller('OfferCtrl', function($scope, $sce, $state, gettext, toaster,
                                          Loader, ConfigAPI, Permission, Session) {
    $scope.flags = {};
    $scope.toggleForm = toggleForm;
    $scope.accept = accept;
    $scope.reject = reject;
    $scope.sign = sign;
    $scope.ready = false;
    Loader.page(true);
    var email;

    Permission.requireSignup().then(function() {
      $scope.id = $state.params.id;

      ConfigAPI.rejectReasons().then(fn.setTo('rejectReasons', $scope));
      Session.getUser()
        .then(fn.invoke('getData', []))
        .then(function(data) {
          email = data.email;
        });

      return Session.user.getOffer($scope.id);
    }).then(function(offer) {

      Session.getUser()
        .then(function(candidate) {
          $scope.has_been_hired = candidate._data.candidate_has_been_hired;
          if ($scope.has_been_hired) {
            toaster.success(offer.status === 'CONTRACT_SIGNED' ?
              gettext('You have already accepted this offer!') :
              gettext('You have already accepted another offer!'),
              { untilStateChange: true });
          }
        });


      return offer.getTimeline().then(function(timeline) {
        return [ offer, timeline ];
      });
    }).then(function(data) {
      this.onStatusChange = onStatusChange;
      $scope.ready = true;
      $scope.offer = data[0];
      $scope.timeline = data[1];

      $scope.offer.setDataParser(function(data) {
        data.message = $sce.trustAsHtml(data.message);
        data.interview_details = $sce.trustAsHtml(data.interview_details);
        data.job_description = $sce.trustAsHtml(data.job_description);
      });

    }.bind(this)).finally(function() {
      Loader.page(false);
    });


    function onStatusChange() {
      toaster.success(gettext('Offer {{ status }}', {
        status: $scope.offer.statusText,
      }));
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
        .finally(function() {
          toaster.success(
            gettext('<h2>Congratulation to your new position!</h2>\nYour profile will be on sleep!'),
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
  };
});
