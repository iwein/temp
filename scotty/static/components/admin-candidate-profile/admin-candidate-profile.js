define(function(require) {
  'use strict';
  require('components/directive-target-positions/directive-target-positions');
  require('components/directive-experience/directive-experience');
  require('components/directive-education/directive-education');
  var module = require('app-module');

  module.controller('CandidateProfileCtrl', function($scope, $state, toaster, Loader, Session) {
    $scope.id = $state.params.id;
    $scope.ready = false;
    Loader.page(true);

    Session.getCandidate($scope.id).then(function(candidate) {
      $scope.candidate = candidate;
      return candidate.getData();
    }).then(function(data) {
      $scope.ready = true;
      $scope.cities = data.preferred_location;
      $scope.languages = data.languages;
      $scope.skills = data.skills;
      $scope.user = data;
    }).catch(function() {
      toaster.defaultError();
    }).finally(function() {
      Loader.page(false);
    });
  });


  return {
    url: '/candidate/:id',
    template: require('text!./admin-candidate-profile.html'),
    controller: 'CandidateProfileCtrl',
    controllerAs: 'candidateProfile',
  };
});
