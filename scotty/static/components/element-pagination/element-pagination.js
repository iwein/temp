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
        load: '&',
      },
      link: function(scope, elem, attr) {
        var items = +scope.itemsPerPage;
        scope.loadPage = loadPage;
        scope.pages = 0;

        if ('autoload' in attr)
          loadPage(0);

        function loadPage(index) {
          return scope.load({
            $params: {
              limit: items,
              offset: index * items,
            }
          }).then(function(pagination) {
            scope.pages = Math.ceil(pagination.total / items);
          });
        }
      }
    };
  });
});
