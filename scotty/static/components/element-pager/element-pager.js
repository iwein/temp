define(function(require) {
  'use strict';
  var module = require('app-module');

  module.directive('hcPager', function() {
    return {
      restrict: 'E',
      template: require('text!./element-pager.html'),
      scope: {
        count: '=',
        onClick: '&',
      },
      link: function(scope) {
        scope.loadPage = function(page) {
          scope.current = page;
          scope.onClick({ $page: page - 1 });
        };

        scope.$watch('count', function(count) {
          scope.current = 1;
          scope.buttons = [];
          for (var i = 0; i < count; i++)
            scope.buttons.push(i + 1);
        });
      }
    };
  });
});
