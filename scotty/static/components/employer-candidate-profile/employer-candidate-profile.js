define(function(require) {
  'use strict';
  require('components/directive-experience/directive-experience');
  require('components/directive-education/directive-education');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.controller('CandidateProfileCtrl', function($scope, $q, $state, toaster, Loader, Permission, Session) {
    $scope.id = $state.params.id;
    $scope.ready = false;
    $scope.starValues = [ null, 'basic', 'advanced', 'expert' ];
    Loader.page(true);

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
        ]);
      }).then(function(data) {
        var user = data[0];
        $scope.targetPosition = data[1];
        $scope.workExperience = data[2];
        $scope.education = data[3];

        $q.all(data[4].slice(0, 3).map(fn.invoke('getData', [])))
          .then(fn.setTo('offers', $scope));

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
    template: require('text!./employer-candidate-profile.html'),
    controller: 'CandidateProfileCtrl',
    controllerAs: 'candidateProfile',
  };
});
