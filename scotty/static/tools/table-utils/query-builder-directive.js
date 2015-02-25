'use strict';
define(function(require) {
  var module = require('./table-utils');

  module.directive('queryBuilder', function() {
    var defaultLimit = 20;
    return {
      restrict: 'A',
      scope: {
        models: '=queryBuilder',
        default: '@',
        reverse: '@',
      },
      controller: function($scope) {
        var self = this;
        var queryOpts = {};

        if($scope.default)
          self.sortField = $scope.default;
        if($scope.reverse)
          self.reverse = true;

        function resetQuery() {
          queryOpts.limit = defaultLimit;
          queryOpts.offset = 0;
        }
        resetQuery();

        function updateResults() {
          return $scope.models.getList(queryOpts)
          .then(function(models) {
            $scope.models = models;
          });
        }

        self.sort = function(field, reverse) {
          self.sortField = field;
          self.reverse = !!reverse;

          resetQuery();
          queryOpts.order = reverse ? '-' + field : field;
          return updateResults();
        };

        self.loadMore = function() {
          queryOpts.limit += defaultLimit;
          return updateResults();
        };

        self.hasMore = function() {
          if ($scope.models.metadata) {
            return $scope.models.length < $scope.models.metadata.pagination.total;
          } else {
            return false;
          }
        };

        self.search = function(q) {
          resetQuery();
          queryOpts.q = q;
          return updateResults();
        };

        self.filter = function(field, value) {
          resetQuery();
          queryOpts[field] = value;
          return updateResults();
        };

        self.removeFilter = function(field) {
          resetQuery();
          delete queryOpts[field];
          return updateResults();
        };
      }
    };
  });
});
