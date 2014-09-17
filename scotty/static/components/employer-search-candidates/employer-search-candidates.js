define(function(require) {
  'use strict';
  require('tools/config-api');
  require('session');
  var module = require('app-module');


  module.controller('SearchCtrl', function($scope, toaster, ConfigAPI, Session) {
    this.searchSkills = ConfigAPI.skills;
    this.onTermsChange = onTermsChange;

    function onTermsChange(terms) {
      Session.searchCandidates(terms).then(function(results) {
        $scope.candidates = results;
      }).catch(function() {
        toaster.error('Endpoint not connected yet');
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
