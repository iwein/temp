define(function(require) {
  'use strict';
  var _ = require('underscore');
  var nameAttr = require('tools/name-attr');
  var module = require('app-module');

  module.directive('hcAdminSearch', function() {
    return {
      restrict: 'EA',
      transclude: true,
      template: require('text!./admin-directive-search.html'),
      scope: {
        onSearch: '&',
        hcShowSkills: '=',
      },
      controller: function($scope, $attrs, toaster, ConfigAPI) {
        $scope.searchSkills = ConfigAPI.skills;
        $scope.loadMore = loadMore;
        $scope.search = _.debounce(search, 200);
        $scope.output = [];
        $scope.tags = [];
        var show = 20;
        var counter = 0;

        nameAttr(this, 'hcAdminSearch', $scope, $attrs);

        function reset() {
          $scope.loading = false;
          $scope.loaded = false;
          $scope.results = [];
          $scope.total = 0;
          counter++;
        }

        function setResults(results) {
          $scope.output = results;
          $scope.$parent.results = results;
        }
        function pushResults(results) {
          if (!$scope.output)
            $scope.output = [];
          $scope.$parent.results = $scope.output.concat(results);
        }

        function getResults(offset) {
          $scope.loading = true;
          var instance = ++counter;
          var params = {
            q: $scope.term,
            limit: show,
          };

          if ($scope.tags.length)
            params.tags = $scope.tags;

          if (offset)
            params.offset = offset;

          return $scope.onSearch({ $params: params })
            .then(function(response) {
              // if another call was made after this one...
              if (instance !== counter)
                return null;

              $scope.total = response.pagination.total;
              $scope.loaded = true;
              return response.data;
            })
            .catch(toaster.defaultError)
            .finally(function() {
              $scope.loading = false;
            });
        }

        function loadMore() {
          getResults($scope.results.length).then(function(results) {
            if (results)
              pushResults($scope.output.concat(results));
          });
        }

        function search() {
          if (!$scope.term && !($scope.tags && $scope.tags.length)) {
            $scope.$apply(reset);
            return;
          }

          getResults().then(function(results) {
            if (results)
              setResults(results);
          });
        }
      },
    };
  });
});
