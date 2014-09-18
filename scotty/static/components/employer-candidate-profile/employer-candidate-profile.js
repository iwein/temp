define(function(require) {
  'use strict';
  require('session');
  require('components/directive-target-positions/directive-target-positions');
  require('components/directive-experience/directive-experience');
  require('components/directive-education/directive-education');
  var module = require('app-module');

  module.controller('CandidateProfileCtrl', function($scope, $state, toaster, Session) {
    $scope.id = $state.params.id;

    Session.getCandidateData($scope.id).then(function(data) {
      $scope.ready = true;
      $scope.cities = data.preferred_cities;
      $scope.languages = data.languages;
      $scope.skills = data.skills;
      $scope.user = data;
    }).catch(function() {
      toaster.defaultError();
    });
  });


  return {
    url: '/candidate/:id',
    template: require('text!./employer-candidate-profile.html'),
    controller: 'CandidateProfileCtrl',
    controllerAs: 'candidateProfile',
  };
});
