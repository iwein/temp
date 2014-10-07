define(function(require) {
  'use strict';
  require('components/directive-target-positions/directive-target-positions');
  require('components/directive-experience/directive-experience');
  require('components/directive-education/directive-education');
  var module = require('app-module');

  module.controller('CandidateProfileCtrl', function($scope, $state, toaster, Loader, Permission, Session) {
    $scope.id = $state.params.id;
    $scope.ready = false;
    Loader.page(true);

    Permission.requireActivated()
      .then(function() { return Session.getCandidate($scope.id) })
      .then(function(candidate) {
        $scope.candidate = candidate;
        return candidate.getData();
      })
      .then(function(data) {
        $scope.ready = true;
        $scope.cities = data.preferred_location;
        $scope.languages = data.languages;
        $scope.skills = data.skills;
        $scope.user = data;
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
