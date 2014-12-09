define(function(require) {
  'use strict';
  var module = require('app-module');

  module.directive('hcGreaterThan', function($parse) {
    return {
      require: 'ngModel',
      compile: function(elem, attr) {
        var model = $parse(attr.ngModel);
        var compareTo = $parse(attr.hcGreaterThan);

        return function(scope, elem, attr, ctrl) {
          scope.$watch(attr.ngModel + '+' + attr.hcGreaterThan, function() {
            var value = model(scope);
            var target = compareTo(scope);
            if(typeof value !== 'undefined')
              ctrl.$setValidity('greaterThan', value >= target);
          });
        };
      }
    };
  });
});
