define(function(require) {
  'use strict';
  var module = require('app-module');

  module.directive('hcFileSelect', function($parse) {
    return {
      compile: function(elem, attr) {
        var element = elem[0];
        var model = attr.ngModel;
        var onChange = attr.hcFileSelect;
        var setModel = $parse(model).assign;
        var execOnChange = $parse(onChange);

        return function postLink(scope) {
          element.addEventListener('change', function() {
            scope.$apply(function() {
              setModel(scope, element.files);
              execOnChange(scope, { $files: element.files });
            });
          });
        };
      }
    };
  });
});
