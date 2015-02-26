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
        hcStatuses: '=',
        hcStatus: '@'
      },
      controller: function($scope, $attrs, toaster, ConfigAPI) {
        $scope.searchSkills = ConfigAPI.skills;
        $scope.search = _.debounce(getResults, 200);
        $scope.getResults = getResults;
        $scope.output = [];
        $scope.tags = [];
        $scope.showItems = 20;
        var counter = 0;
        var order;

        nameAttr(this, 'hcAdminSearch', $scope, $attrs);

        function getResults(params) {
          $scope.loading = true;
          var instance = ++counter;

          if (!params)
            params = { limit: $scope.showItems };

          if (params.order)
            order = params.order;
          else if (order)
            params.order = order;

          if ($scope.term)
            params.q = $scope.term;

          if ($scope.tags.length)
            params.tags = $scope.tags;

          if ($scope.hcStatus)
            params.status = $scope.hcStatus;

          return $scope.onSearch({ $params: params })
            .then(function(response) {
              // if another call was made after this one...
              if (instance !== counter)
                return null;

              var data = response.data;
              data.getList = getResults;
              $scope.$parent.results = data;
              $scope.results = data;
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
