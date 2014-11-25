define(function(require) {
  'use strict';
  require('components/directive-candidate/directive-candidate');
  require('components/directive-offer/directive-offer');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');
  var levels = {
    'null': 0,
    'undefined': 0,
    'basic': 1,
    'advanced': 2,
    'expert': 3,
  };


  // jshint maxparams:8
  module.controller('DashboardCtrl', function($scope, $q, $sce, toaster, Loader, ConfigAPI, Permission, Session) {
    this.searchLocations = ConfigAPI.locationsText;
    this.searchSkills = ConfigAPI.skills;
    this.setLocation = setLocation;
    this.search = search;
    $scope.today = new Date();
    $scope.getTimelineText = getTimelineText;
    $scope.ready = false;
    Loader.page(true);

    Permission.requireActivated().then(function() {
      return Session.getUser();
    }).then(function(user) {
      return $q.all([
        user.getTimeline(),
        user.getOffers(),
        user.getSuggestedCandidates(),
        user.getCandidates(),
      ]);
    }).then(function(results) {
      $scope.ready = true;
      $scope.news = results[0];
      $scope.offers = results[1];
      $scope.suggested = results[2];
      $scope.candidates = results[3];

      $scope.suggested.forEach(function(candidate) {
        candidate.getTargetPosition().then(fn.setTo('targetPosition', candidate));
      });

      $scope.candidates.forEach(function(candidate) {
        candidate.getLastPosition().then(fn.setTo('position', candidate));
      });

      $scope.offers.forEach(function(offer) {
        offer.setDataParser(function(data) {
          data.interview_details = $sce.trustAsHtml(data.interview_details);
          data.job_description = $sce.trustAsHtml(data.job_description);
        });
      });
    }).finally(function() {
      Loader.page(false);
    });


    function setLocation(text) {
      $scope.location = ConfigAPI.getLocationFromText(text || $scope.locationText);
      search();
    }

    function search() {
      var tags = $scope.terms && $scope.terms.join();
      var params = _.extend({}, $scope.location, tags ? { tags: tags } : null);

      $scope.loading = true;
      Session.searchCandidates(params)
        .then(function(candidates) {
          return $q.all(candidates.map(function(candidate) {
            return candidate.getLastPosition();
          })).then(function(positions) {
            return candidates.map(function(candidate, index) {
              candidate._data.position = positions[index];
              candidate._data.skills = candidate._data.skills.sort(function(a, b) {
                return levels[b.level] - levels[a.level];
              }).slice(9);
              return candidate._data;
            });
          });
        })
        .then(function(result) {
          $scope.searchResults = result;
        })
        .catch(toaster.defaultError)
        .finally(function() {
          $scope.loading = false;
        });
    }

    function getTimelineText(name, entry) {
      var candidate = entry.candidate && entry.candidate.first_name;

      return {
        SIGN_UP: 'You signed up',
        BOOKMARKED: candidate + ' has bookmarked you.',
        //OFFER_RECEIVED: '',
        OFFER_ACCEPTED: 'Brilliant you have accepted an interview with ' + candidate,
        OFFER_REJECTED: 'Offer sent to ' + candidate + ' was rejected',
        OFFER_SENT: 'You sent an offer to ' + candidate,
        OFFER_START_DATE: 'Amazing! You started working with ' + candidate,
        OFFER_NEGOTIATION: 'Nearly there, you have started negotiating the details with ' + candidate,
        OFFER_SIGNED: 'Winning! you have signed a contract with ' + candidate +
          ' and will receive your golden handshake soon',
        PROFILE_PENDING: 'You agreed terms and conditions',
        PROFILE_LIVE: 'Congrats! You were approved!',
      }[name];
    }
  });

  return {
    url: '/dashboard/',
    template: require('text!./employer-dashboard.html'),
    controller: 'DashboardCtrl',
    controllerAs: 'dashboard',
  };
});
