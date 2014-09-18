define(function(require) {
  'use strict';
  require('tools/config-api');
  require('session');
  require('components/directive-candidate/directive-candidate');
  var module = require('app-module');

  module.controller('SignupSuggestCtrl', function($scope, $state, ConfigAPI, Session) {
    $scope.loading = true;

    Session.getSuggestedCandidates().then(function(candidates) {
      $scope.candidates = candidates.map(function(entry) {
        entry.first_name = entry.first_name[0] + '.';
        entry.last_name = entry.last_name[0] + '.';
        return entry;
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


