define(function(require) {
  'use strict';
  require('components/admin-directive-search/admin-directive-search');
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
      return Session.searchCandidates(params);
    }
  });


  return {
    url: '/search-candidates/',
    template: require('text!./admin-search-candidates.html'),
    controller: 'SearchCandiatesCtrl',
    controllerAs: 'searchCandidates'
  };
});
