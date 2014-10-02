define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-candidate/directive-candidate');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');


  module.controller('SearchCandiatesCtrl', function($scope, $q, toaster, Session) {
    $scope.loadMore = loadMore;
    $scope.search = _.debounce(search, 100);
    $scope.limit = 20;
    var perStep = $scope.limit;

    function loadMore() {
      $scope.limit += perStep;
    }

    function search() {
      Session.searchCandidates({ q: $scope.term }).then(function(candidates) {
        return $q.all(candidates.map(fn.invoke('getData', [])));
      }).then(function(results) {
        $scope.candidates = results;
      }).catch(toaster.defaultError);
    }
  });


  return {
    url: '/search-candidates/',
    template: require('text!./admin-search-candidates.html'),
    controller: 'SearchCandiatesCtrl',
    controllerAs: 'searchCandidates',
  };
});
