define(function(require) {
  'use strict';
  var module = require('app-module');

  module.directive('hcValidationsOnSubmit', function() {

    function makeControlsDirty(component) {
      var errors = component.$error;
      var keys = Object.keys(errors);
      component.$dirty = true;
      if (!keys.length) return [];

      // it's a field
      if (errors[keys[0]] === true)
        return component;

      return keys.reduce(function(fields, key) {
        return fields.concat(errors[key].forEach(makeControlsDirty));
      }, []);
    }

    return {
      restrict: 'A',
      require: 'form',
      link: function(scope, elem, attr, ctrl) {
        var element = elem[0];
        element.addEventListener('submit', function(event) {
          scope.$apply(function() {
            var fields = makeControlsDirty(ctrl).filter(Boolean);
            var first = fields.filter(function(field) {
              return field.$name;
            })[0];

            if (first) {
              var dom = element.querySelector('[name=' + first.$name + ']');
              if (dom) dom.focus();
            }

            if (fields.length)
              event.preventDefault();
          });
        });
      }
    };
  });
});
