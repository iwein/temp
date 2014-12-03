define(function(require) {
  'use strict';
  require('components/directive-experience/directive-experience');
  require('components/directive-education/directive-education');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.controller('CandidateProfileCtrl', function($scope, $q, $state, toaster, Loader, Permission, Session) {
    $scope.toggle = toggle;
    $scope.id = $state.params.id;
    $scope.ready = false;
    $scope.starValues = [ null, 'basic', 'advanced', 'expert' ];
    Loader.page(true);

    function toggle(key) {
      $scope[key] = !$scope[key];
    }

    Permission.requireActivated()
      .then(function() { return Session.getCandidate($scope.id) })
      .then(function(candidate) {
        $scope.candidate = candidate;
        return $q.all([
          candidate.getData(),
          candidate.getTargetPosition(),
          candidate.getExperience(),
          candidate.getEducation(),
          candidate.getOffers(),
          candidate.getHighestDegree(),
        ]);
      }).then(function(data) {
        var user = data[0];
        var offers = data[4];
        $scope.targetPosition = data[1];
        $scope.workExperience = data[2];
        $scope.education = data[3];
        $scope.highestDegree = data[5];

        $scope.offerSent = offers.some(function(entry) {
          return entry.data.employer_id === Session.user.id;
        });

        var finalStatus = [ 'REJECTED', 'WITHDRAWN' ];
        $scope.status = offers.reduce(function(summary, value) {
          if (finalStatus.indexOf(value.status) !== -1) return;
          if (value.status === 'CONTRACT_SIGNED') return 'hired';
          return summary || 'reviewing';
        }, null) || 'searching';

        Session.getUser().then(function(user) {
          var nonAccepted = finalStatus.concat([ 'ACTIVE' ]);
          $scope.accepted = offers
            .filter(function(entry) { return entry.data.employer.id === user.id })
            .some(function(entry) { return finalStatus.indexOf(entry.status) === -1 });
        });

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
            role: entry.role,
          };
        });
        timeline.forEach(function(entry) {
          entry.percent = 100 / total * entry.duration;
        });
        $scope.totalWorkExperience = total;
        $scope.timeline = timeline.sort(function(a, b) {
          return a.start - b.start;
        });


        $q.all(offers.slice(0, 3).map(fn.invoke('getData', [])))
          .then(fn.setTo('offers', $scope));

        $scope.cities = user.preferred_location;
        $scope.languages = user.languages;
        $scope.skills = user.skills;
        $scope.user = user;
        $scope.ready = true;

        var leveledSkills = user.skills.filter(fn.get('level'));
        var unleveledSkills = user.skills.filter(fn.not(fn.get('level')));
        $scope.leveledSkills = leveledSkills.slice(0, 9);
        $scope.unleveledSkills = leveledSkills.slice(0, 9)
          .concat(unleveledSkills)
          .map(fn.get('skill'))
          .join(', ');
      })
      .catch(toaster.defaultError)
      .finally(function() { Loader.page(false) });
  });


  return {
    url: '/candidate/:id',
    template: require('text!./employer-candidate-profile.html'),
    controller: 'CandidateProfileCtrl',
    controllerAs: 'candidateProfile',
  };
});
