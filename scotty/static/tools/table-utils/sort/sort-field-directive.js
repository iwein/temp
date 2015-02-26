'use strict';
define(function(require) {
  require('../query-builder-directive');
  var module = require('../table-utils');

  module.directive('sortField', function() {
    return {
      restrict: 'A',
      require: '^queryBuilder',
      transclude: true,
      scope: true,
      template: require('text!./sort-field.html'),
      link: function($scope, $element, $attrs, queryBuilderCtrl) {
        var loading;

        $scope.sort = function() {
          var reverse = queryBuilderCtrl.sortField === $attrs.sortField && !queryBuilderCtrl.reverse;

          loading = true;
          queryBuilderCtrl.sort($attrs.sortField, reverse)
          .finally(function() {
            loading = false;
          });
        };

        $scope.getSortClass = function() {
          if (queryBuilderCtrl.sortField === $attrs.sortField) {
            if (loading) {
              return 'fa-spinner fa-spin';
            } else if (queryBuilderCtrl.reverse) {
              return 'fa-sort-desc';
            } else {
              return 'fa-sort-asc';
            }
          } else {
            return 'fa-sort';
          }
        };
      }
    };
  });
});
