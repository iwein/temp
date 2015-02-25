'use strict';
define(function(require) {
  require('../query-builder-directive');
  var module = require('../table-utils');

  module.directive('search', function($timeout) {
    return {
      restrict: 'E',
      require: '^queryBuilder',
      replace: true,
      scope: {
        models: '='
      },
      template: require('text!./search.html'),
      link: function ($scope, $element, $attrs, queryBuilderCtrl) {
        var stopTimeout;
        var firstTime = true;
        $scope.search = '';

        $scope.$watch('search', function (search) {
          if (firstTime) {
            firstTime = false;
            return;
          }

          $timeout.cancel(stopTimeout);
          $scope.loading = false;

          stopTimeout = $timeout(function () {
            $scope.loading = true;
            queryBuilderCtrl.search(search)
            .finally(function() {
              $scope.loading = false;
            });
          }, 500);
        });
      }
    };
  });
});


