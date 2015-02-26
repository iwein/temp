'use strict';
define(function(require) {
  require('../query-builder-directive');
  var module = require('../table-utils');

  module.directive('loadMore', function() {
    return {
      restrict: 'E',
      require: '^queryBuilder',
      template: require('text!./load-more.html'),
      link: function($scope, $element, $attrs, queryBuilderCtrl) {
        $scope.show = function() {
          return queryBuilderCtrl.hasMore();
        };

        $scope.loadMore = function() {
          $scope.loading = true;
          queryBuilderCtrl.loadMore()
          .finally(function() {
            $scope.loading = false;
          });
        };
      }
    };
  });
});
