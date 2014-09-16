define(function(require) {
  'use strict';
  var module = require('app-module');

  module.directive('hcFileSelect', function($parse) {
    return {
      restrict: 'A',
      compile: function(elem, attr) {
        var element = elem[0];
        var model, onChange;

        if (attr.ngModel)
          model = $parse(attr.ngModel).assign;

        if (attr.hcFileSelect)
          onChange = $parse(attr.hcFileSelect);

        return function postLink(scope) {
          element.addEventListener('change', function() {
            scope.$apply(function() {
              if (model)
                model(scope, element.files);

              if (onChange)
                onChange(scope, { $files: element.files });
            });
          });
        };
      }
    };
  });
});
