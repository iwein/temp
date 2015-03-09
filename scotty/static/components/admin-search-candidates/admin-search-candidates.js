define(function(require) {
  'use strict';
  require('components/admin-directive-search/admin-directive-search');
  require('components/element-candidate-status/element-candidate-status');
  require('components/directive-candidate/directive-candidate');
  var module = require('app-module');


  module.controller('SearchCandiatesCtrl', function($scope, Session) {
    $scope.executeSearch = executeSearch;

    $scope.status = 'active';
    $scope.statuses = [$scope.status];

    Session.getCandidateStatuses().then(function(resp){
      $scope.statuses = resp.data;
    });

    function executeSearch(params) {
      return Session.searchCandidates(params).then(function(response) {
        response.data.forEach(function(candidate) {
          candidate.preferred_location = parsePreferredLocations(candidate._data.preferred_location);
          candidate.skills = candidate._data.skills.map(function(skill) {
            return skill.skill;
          }).join(', ');
        });
        return response;
      });
    }

    function parsePreferredLocations(locations) {
      if (!locations) return 'Not specified';

      return Object.keys(locations).map(function(country) {
        var cities = locations[country];
        var text = cities.length ? cities.join(', ') : 'Anywhere';
        return text + ' ' + country;
      }).join(' - ');
    }
  });


  return {
    url: '/search-candidates/',
    template: require('text!./admin-search-candidates.html'),
    controller: 'SearchCandiatesCtrl',
    controllerAs: 'searchCandidates'
  };
});
