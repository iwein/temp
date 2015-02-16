define(function(require) {
  'use strict';
  var angular = require('angular');
  var module = require('app-module');

  module.directive('hcScope', function() {
    return {
      restrict: 'EA',
      scope: true,
      link: function(scope, element, attr) {
        var json = attr.hcScope || attr.values;
        scope.$watch(json, function(values) {
          angular.extend(scope, values);
        });
      }
    };
  });
});
