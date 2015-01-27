define(function(require) {
  'use strict';
  require('components/partial-candidate-pic/partial-candidate-pic');
  var fn = require('tools/fn');
  var module = require('app-module');

  //jshint maxparams:9
  module.controller('CandidateProfileCtrl', function($scope, $q, $state, gettext, toaster,
                                                    Loader, Permission, Session, ThisCandidate) {
    $scope.toggle = toggle;
    $scope.id = $state.params.id;
    $scope.ready = false;
    $scope.starValues = [ null, 'basic', 'advanced', 'expert' ];
    Loader.page(true);

    var user = ThisCandidate._data;
    $scope.canMakeOffer =
      Session.isApproved &&
      !user.employer_has_offers &&
      !user.candidate_has_been_hired &&
      !user.employer_blacklisted &&
      !user.employer_has_accepted_offers;
    $scope.offerSent = user.employer_has_offers;

    function toggle(key) {
      $scope[key] = !$scope[key];
    }

    $scope.candidate = ThisCandidate;

    Permission.requireSignup().then(function() {

      $q.all([
        ThisCandidate.getOffers(),
        ThisCandidate.getTargetPosition().then(fn.setTo('targetPosition', $scope)),
        ThisCandidate.getExperience().then(fn.setTo('workExperience', $scope)),
        ThisCandidate.getEducation().then(fn.setTo('education', $scope)),
        ThisCandidate.getHighestDegree().then(fn.setTo('highestDegree', $scope)),
      ]).then(function(data) {
        var offers = data[0];

        var finalStatus = [ 'REJECTED', 'WITHDRAWN' ];
        $scope.status = (ThisCandidate._data.status === 'sleeping') ? gettext('sleeping') :
          (
            offers.reduce(function(summary, value) {
              if (finalStatus.indexOf(value.status) !== -1) return;
              if (value.status === 'CONTRACT_SIGNED') return gettext('hired');
              return summary || gettext('reviewing');
            }, null) || gettext('searching')
          );
        // TIMELINE

        var total = 0;
        var timeline = $scope.workExperience.map(function(entry) {
          var start = new Date(entry.start);
          var end = entry.end ? new Date(entry.end) : new Date();
          var duration = end - start;
          total += duration;
          return {
            start: start,
            duration: duration,
            role: entry.role
          };
        });
        timeline.forEach(function(entry) {
          entry.percent = 100 / total * entry.duration;
        });
        $scope.totalWorkExperience = total;
        $scope.timeline = timeline.sort(function(a, b) {
          return a.start - b.start;
        });

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

        $scope.cities = user.preferred_location;
        $scope.languages = user.languages;
        $scope.skills = user.skills;
        $scope.user = user;
        $scope.ready = true;

        var leveledSkills = user.skills.filter(fn.get('level'));
        var unleveledSkills = user.skills.filter(fn.not(fn.get('level')));
        $scope.leveledSkills = leveledSkills.slice(0, 9);
        $scope.unleveledSkills = leveledSkills.slice(9)
          .concat(unleveledSkills)
          .map(fn.get('skill'))
          .join(', ');
      })
        .catch(toaster.defaultError)
        .finally(function() { Loader.page(false) });
    });

  });

  return {
    url: '/candidate/:id',
    resolve: {
      ThisCandidate: [
        // ngAnnotate doen't catch this function
        '$stateParams', 'Session',
        function($stateParams, Session) {
          return Session.getCandidate($stateParams.id);
        }
      ]
    },
    template: require('text!./employer-candidate-profile.html'),
    controller: 'CandidateProfileCtrl',
    controllerAs: 'candidateProfile'
  };
});
