define(function(require) {
  'use strict';
  require('tools/config-api');
  require('session');
  require('components/directive-candidate/directive-candidate');
  var module = require('app-module');

  module.controller('SignupSuggestCtrl', function($scope, $state, Loader, ConfigAPI, Session) {
    $scope.loading = true;
    $scope.approved = false;
    Loader.page(true);

    Session.isActivated().then(function(value) {
      if (value)
        $state.go('dashboard');
    }).finally(function() {
      $scope.ready = true;
    });

    Session.getUser().then(function(user) {
      return user && user.getSuggestedCandidates();
    }).then(function(candidates) {
      if (!candidates) return;

      $scope.candidates = candidates.map(function(entry) {
        entry._data.first_name = entry._data.first_name[0] + '.';
        entry._data.last_name = entry._data.last_name[0] + '.';
        return entry;
      });

      Loader.page(false);
    });
  });

  return {
    url: '/approval/',
    template: require('text!./employer-signup-suggest.html'),
    controller: 'SignupSuggestCtrl',
    controllerAs: 'signupSuggest',
  };
});


