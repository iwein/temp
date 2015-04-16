define(function(require) {
  'use strict';
  require('components/element-candidate-status/element-candidate-status');
  require('../candidate-profile/availability/availability');
  require('../candidate-profile/avatar/avatar');
  require('../candidate-profile/birthdate/birthdate');
  require('../candidate-profile/contact/contact');
  require('../candidate-profile/cv/cv');
  require('../candidate-profile/education/education');
  require('../candidate-profile/experience/experience');
  require('../candidate-profile/languages/languages');
  require('../candidate-profile/name/name');
  require('../candidate-profile/offers/offers');
  require('../candidate-profile/privacy/privacy');
  require('../candidate-profile/salary/salary');
  require('../candidate-profile/skills/skills');
  require('../candidate-profile/summary/summary');
  require('../candidate-profile/target/target');
  var _ = require('underscore');
  var module = require('app-module');


  // jshint maxstatements:35
  module.controller('CandidateProfileCtrl', function($scope, i18n, Loader, Session, candidate) {
    var data = candidate.getDataCached();
    _.extend($scope, {
      url: window.location.toString(),
      data: data,
      candidate: candidate,
      offerSent: data.employer_has_offers,
      canMakeOffer:
        Session.isApproved &&
        !data.employer_has_offers &&
        !data.candidate_has_been_hired &&
        !data.employer_blacklisted &&
        !data.employer_has_accepted_offers,
    });

    onLoad();


    function onLoad() {
      i18n.onChange(translate);
      translate();

      return Promise.all([
        candidate.getTargetPosition(),
        candidate.getExperience(),
        candidate.getEducation(),
        candidate.getOffers().then(function(offers) {
          $scope.allOffers = offers;
        }),
      ]).then(function() {
        $scope.ready = true;
      }).finally(function() {
        Loader.page(false);
      });
    }

    function translate() {
      $scope.lang = i18n.getCurrent();
    }
  });


  return {
    url: '/candidate/:id',
    template: require('text!./employer-candidate-profile.html'),
    controller: 'CandidateProfileCtrl',
    controllerAs: 'profile',
    resolve: {
      /*@ngInject*/
      candidate: function($stateParams, Session) {
        return Session.getCandidate($stateParams.id);
      },
    },
  };
});
