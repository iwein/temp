define(function(require) {
  'use strict';
  require('components/directive-experience/directive-experience');
  require('components/directive-education/directive-education');
  var module = require('app-module');

  module.controller('CandidateProfileCtrl', function($scope, $q, $state, toaster, Loader, Permission, Session) {
    $scope.id = $state.params.id;
    $scope.ready = false;
    Loader.page(true);

    Permission.requireActivated()
      .then(function() { return Session.getCandidate($scope.id) })
      .then(function(candidate) {
        $scope.candidate = candidate;
        return $q.all([
          candidate.getData(),
          candidate.getTargetPosition(),
        ]);
      }).then(function(data) {
        var user = data[0];
        $scope.targetPosition = data[1];
        $scope.cities = user.preferred_location;
        $scope.languages = user.languages;
        $scope.skills = user.skills;
        $scope.user = user;
        $scope.ready = true;
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
