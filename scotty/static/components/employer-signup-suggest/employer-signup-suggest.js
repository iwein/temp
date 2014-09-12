define(function(require) {
  'use strict';
  require('tools/config-api');
  require('session');
  var module = require('app-module');

  module.controller('SignupSuggestCtrl', function($scope, $state, ConfigAPI, Session) {
    $scope.error = false;
    $scope.loading = true;

    function anonymize(entry) {
      return entry.first_name[0] + '. ' + entry.last_name[0] + '.';
    }

    function calcExperience() { // (entry) {
      // TODO: Calculate experience
      return Math.round(Math.random() * 15);
    }

    Session.getSuggestedCandidates().then(function(candidates) {
      $scope.candidates = candidates.map(function(entry) {
        return {
          name: anonymize(entry),
          city: ConfigAPI.locationToText(entry.contact_city),
          yearsOfExperience: calcExperience(entry),
          skills: entry.skills.map(function(item) {
            return item.skill;
          })
        };
      });
    });
  });

  return {
    url: '/suggest/',
    template: require('text!./employer-signup-suggest.html'),
    controller: 'SignupSuggestCtrl',
    controllerAs: 'signupSuggest',
  };
});


