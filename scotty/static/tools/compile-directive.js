define(function(require) {
  'use strict';
  var module = require('app-module');

  module.directive('compile', function($compile) {
    return function(scope, element, attrs) {
      scope.$watch(function(scope) {
        return scope.$eval(attrs.compile);
      }, function(value) {
        element.html(value);
        $compile(element.contents())(scope);
      });
    };
  });
});
