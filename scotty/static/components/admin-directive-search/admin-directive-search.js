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
        $scope.search = _.debounce(getResults, 200);
        $scope.getResults = getResults;
        $scope.output = [];
        $scope.tags = [];
        $scope.showItems = 20;
        var counter = 0;

        nameAttr(this, 'hcAdminSearch', $scope, $attrs);

        function getResults(params) {
          $scope.loading = true;
          var instance = ++counter;

          if (!params)
            params = { limit: $scope.showItems };

          if ($scope.term)
            params.q = $scope.term;

          if ($scope.tags.length)
            params.tags = $scope.tags;

          return $scope.onSearch({ $params: params })
            .then(function(response) {
              // if another call was made after this one...
              if (instance !== counter)
                return null;

              $scope.$parent.results = response.data;
              $scope.results = response.data;
              $scope.loaded = true;
              $scope.total = response.pagination.total;
            })
            .catch(toaster.defaultError)
            .finally(function() {
              $scope.loading = false;
            });
        }
      },
    };
  });
});
