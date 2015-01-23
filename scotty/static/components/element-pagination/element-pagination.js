define(function(require) {
  'use strict';
  var module = require('app-module');

  module.directive('hcPagination', function() {
    return {
      restrict: 'EA',
      transclude: true,
      template: require('text!./element-pagination.html'),
      scope: {
        itemsPerPage: '@',
        total: '=',
        load: '&',
      },
      link: function(scope, elem, attr) {
        var items = +scope.itemsPerPage;
        scope.loadPage = loadPage;
        scope.pages = 0;

        if ('autoload' in attr)
          loadPage(0);

        scope.$watch('total', function(total) {
          scope.pages = Math.ceil(total / items);
        });

        function loadPage(index) {
          return scope.load({
            $params: {
              limit: items,
              offset: index * items,
            }
          });
        }
      }
    };
  });
});
