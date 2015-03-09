define(function(require) {
  'use strict';
  require('components/element-candidate-status/element-candidate-status');
  require('components/partial-candidate-pic/partial-candidate-pic');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var Date = require('tools/date');
  var module = require('app-module');

  //jshint maxparams:10
  module.controller('CandidateProfileCtrl', function($scope, $q, $state, toaster, i18n,
                                                     Loader, Permission, Session, RequireSignup, candidate) {
    _.extend($scope, {
      toggle: toggle,
      starValues: [ null, 'basic', 'advanced', 'expert' ],
      id: $state.params.id,
      ready: false,
    });

    return onLoad();


    function onLoad() {
      Loader.page(true);
      var data = candidate._data;

      _.extend($scope, {
        candidate: candidate,
        offerSent: data.employer_has_offers,
        canMakeOffer:
          Session.isApproved &&
          !data.employer_has_offers &&
          !data.candidate_has_been_hired &&
          !data.employer_blacklisted &&
          !data.employer_has_accepted_offers,
      });

      i18n.onChange(translate);
      translate();

      return $q.all([
        candidate.getOffers(),
        candidate.getTargetPosition().then(fn.setTo('targetPosition', $scope)),
        candidate.getExperience().then(fn.setTo('workExperience', $scope)),
        candidate.getEducation().then(fn.setTo('education', $scope)),
        candidate.getHighestDegree().then(fn.setTo('highestDegree', $scope)),
      ]).then(function(result) {
        var offers = result[0];
        setOffers(offers);
        setSkills(data.skills);
        generateTimeline($scope.workExperience);
        $scope.preferredLocations = parsePreferredLocations(data.preferred_location);

        _.extend($scope, {
          cities: data.preferred_location,
          languages: data.languages,
          skills: data.skills,
          user: data,
          ready: true
        });
      })
      .catch(toaster.defaultError)
      .finally(function() { Loader.page(false) });
    }

    function translate() {
      $scope.lang = i18n.getCurrent();
    }

    function generateTimeline(experience) {
      var total = 0;
      var timeline = experience.map(function(entry) {
        var start = Date.parse(entry.start);
        var end = entry.end ? Date.parse(entry.end) : Date.now();
        var duration = end - start;
        total += duration;
        return {
          start: start,
          duration: duration,
          role: entry.role
        };
      }).filter(function(entry) {
        return entry.duration !== 0;
      });
      timeline.forEach(function(entry) {
        entry.percent = 100 / total * entry.duration;
      });
      $scope.totalWorkExperience = total;
      $scope.timeline = timeline.sort(function(a, b) {
        return a.start - b.start;
      });
    }

    function parsePreferredLocations(locations) {
      if (!locations) return i18n.gettext('Not specified');

      return Object.keys(locations).map(function(country) {
        var cities = locations[country];
        var text = cities.length ? cities.join(', ') : i18n.gettext('Anywhere');
        return text + ' ' + country;
      }).join(' - ');
    }

    function setOffers(offers) {
      $scope.allOffers = offers;
      $scope.offers = offers
        .map(fn.get('data'))
        .sort(function(a, b) { return b.annual_salary - a.annual_salary })
        .slice(0, 3);

      var counter = 1;
      $scope.offers.forEach(function(entry) {
        var employer = entry.employer;
        if (employer.company_name.toLowerCase() === 'company')
          employer.company_name = employer.company_name + ' ' + (counter++);
      });
    }

    function setSkills(skills) {
      var leveledSkills = skills.filter(fn.get('level'));
      var unleveledSkills = skills.filter(fn.not(fn.get('level')));
      $scope.leveledSkills = leveledSkills.slice(0, 9);
      $scope.unleveledSkills = leveledSkills.slice(9)
        .concat(unleveledSkills)
        .map(fn.get('skill'))
        .join(', ');
    }

    function toggle(key) {
      $scope[key] = !$scope[key];
    }
  });

  return {
    url: '/candidate/:id',
    template: require('text!./employer-candidate-profile.html'),
    controller: 'CandidateProfileCtrl',
    controllerAs: 'candidateProfile',
    resolve: {
      /*@ngInject*/
      candidate: function($stateParams, Session) {
        return Session.getCandidate($stateParams.id);
      },
      /*@ngInject*/
      RequireSignup: function(Permission) {
        return Permission.requireSignup();
      },
    },
  };
});
