define(function(require) {
  'use strict';
  var module = require('app-module');

  module.directive('hcValidationsOnSubmit', function() {
    return {
      restrict: 'A',
      require: 'form',
      link: function(scope, elem, attr, ctrl) {
        var element = elem[0];
        element.addEventListener('submit', function() {
          scope.$apply(function() {
            var errors = ctrl.$error;
            var fields = Object.keys(errors).reduce(function(fields, key) {
              return fields.concat(errors[key]);
            }, []).reverse();

            fields.forEach(function(field) {
              field.$dirty = true;
              var dom = element.querySelector('[name=' + field.$name + ']');
              if (dom) dom.focus();
            });
          });
        });
      }
    };
  });
});
