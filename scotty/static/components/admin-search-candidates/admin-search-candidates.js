define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-candidate/directive-candidate');
  var _ = require('underscore');
  var module = require('app-module');


  module.controller('SearchCandiatesCtrl', function($scope, $q, toaster, Session) {
    $scope.loadMore = loadMore;
    $scope.search = _.debounce(search, 200);
    var show = 20;
    var counter = 0;

    function reset() {
      $scope.loading = false;
      $scope.loaded = false;
      $scope.candidates = [];
      $scope.total = 0;
      counter++;
    }

    function getCandidates(offset) {
      $scope.loading = true;
      var instance = ++counter;
      var params = {
        q: $scope.term,
        limit: show,
      };

      if (offset)
        params.offset = offset;

      return Session.searchCandidates(params).then(function(response) {
        // if another call was made after this one...
        if (instance !== counter)
          return null;

        $scope.total = response.pagination.total;
        $scope.loading = false;
        $scope.loaded = true;
        return response.data;
      }).catch(toaster.defaultError);
    }

    function loadMore() {
      getCandidates($scope.candidates.length).then(function(candidates) {
        if (candidates)
          $scope.candidates = $scope.candidates.concat(candidates);
      });
    }

    function search() {
      if (!$scope.term) {
        $scope.$apply(reset);
        return;
      }

      getCandidates().then(function(candidates) {
        if (candidates)
          $scope.candidates = candidates;
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
