define(function(require) {
  'use strict';
  require('tools/config-api');
  require('session');
  var module = require('app-module');

  module.controller('SignupSuggestCtrl', function($scope, $state, ConfigAPI, Session) {
    $scope.loading = true;

    function anonymize(entry) {
      return entry.first_name[0] + '. ' + entry.last_name[0] + '.';
    }

    function calcExperience(experience) {
      return experience.reduce(function(sum, entry) {
        var start = new Date(entry.start);
        var end = new Date(entry.end);
        var offset = new Date(0);
        var diff = new Date(end - start);
        var years = diff.getFullYear() - offset.getFullYear();
        return sum + years;
      }, 0);
    }

    Session.getSuggestedCandidates().then(function(candidates) {
      $scope.candidates = candidates.map(function(entry) {
        return {
          name: anonymize(entry),
          city: ConfigAPI.locationToText(entry.contact_city),
          yearsOfExperience: calcExperience(entry.work_experience),
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


