define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-candidate/directive-candidate');
  var module = require('app-module');


  module.controller('SearchCtrl', function($scope, $q, toaster, ConfigAPI, Session) {
    this.searchSkills = ConfigAPI.skills;
    this.onTermsChange = onTermsChange;

    function onTermsChange(terms) {
      Session.searchCandidates(terms).then(function(candidates) {
        return $q.all(candidates.map(function(candidate) {
          return candidate.getData();
        }));
      }).then(function(results) {
        $scope.candidates = results;
      }).catch(function() {
        toaster.defaultError();
      });
    }
  });


  return {
    url: '/search-candidates/',
    template: require('text!./employer-search-candidates.html'),
    controller: 'SearchCtrl',
    controllerAs: 'searchCandidates',
  };
});