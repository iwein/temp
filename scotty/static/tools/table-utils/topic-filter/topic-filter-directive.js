'use strict';
define(function(require) {
  require('../query-builder-directive');
  var module = require('../table-utils');

  module.directive('topicFilter', function() {
    return {
      restrict: 'E',
      scope: {},
      require: '^queryBuilder',
      template: require('text!./topic-filter.html'),
      link: function($scope, $element, $attrs, queryBuilderCtrl) {
        var firstTime = true;
        $scope.container = {};

        $scope.$watch('container.topic', function(topic) {
          if (firstTime) {
            firstTime = false;
            return;
          }

          if (topic) {
            queryBuilderCtrl.filter('topic', topic.slug);
          } else {
            queryBuilderCtrl.removeFilter('topic');
          }
        });
      }
    };
  });
});
