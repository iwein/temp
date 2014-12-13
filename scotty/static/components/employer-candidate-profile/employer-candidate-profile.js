define(function(require) {
  'use strict';
  require('components/directive-experience/directive-experience');
  require('components/directive-education/directive-education');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.controller('CandidateProfileCtrl', function($scope, $q, $state, toaster, Loader, Permission, Session,
                                                     ThisCandidate) {
    $scope.toggle = toggle;
    $scope.id = $state.params.id;
    $scope.ready = false;
    $scope.starValues = [ null, 'basic', 'advanced', 'expert' ];
    Loader.page(true);

    var user = ThisCandidate._data;
    $scope.canMakeOffer =
          Session.isApproved &&
          user.candidate_has_been_hired &&
          user.employer_blacklisted &&
          user.employer_has_accepted_offers;
    $scope.offerSent = user.employer_has_accepted_offers;

    if(user.candidate_has_been_hired){
      toaster.warning('This candidate has been hired!', {untilStateChange: true});
    }

    function toggle(key) {
      $scope[key] = !$scope[key];
    }

    $scope.candidate = ThisCandidate;
    $q.all([
      ThisCandidate.getTargetPosition(),
      ThisCandidate.getExperience(),
      ThisCandidate.getEducation(),
      ThisCandidate.getOffers(),
      ThisCandidate.getHighestDegree(),
    ]).then(function(data) {
      var offers = data[3];
      $scope.targetPosition = data[0];
      $scope.workExperience = data[1];
      $scope.education = data[2];
      $scope.highestDegree = data[4];

      var finalStatus = [ 'REJECTED', 'WITHDRAWN' ];
      $scope.status = offers.reduce(function(summary, value) {
        if (finalStatus.indexOf(value.status) !== -1) return;
        if (value.status === 'CONTRACT_SIGNED') return 'hired';
        return summary || 'reviewing';
      }, null) || 'searching';

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

  return {
    url: '/candidate/:id',
    resolve: {
      ThisCandidate: function($stateParams, Permission, Session) {
        return Permission.requireSignup().then(function() { return Session.getCandidate($stateParams.id) });
      }
    },
    template: require('text!./employer-candidate-profile.html'),
    controller: 'CandidateProfileCtrl',
    controllerAs: 'candidateProfile'
  };
});
