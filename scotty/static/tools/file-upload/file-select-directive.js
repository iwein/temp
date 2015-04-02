define(function(require) {
  'use strict';
  var module = require('app-module');

  module.directive('hcFileSelector', function($parse) {
    return {
      restrict: 'A',
      compile: function(elem, attr) {
        var onChange = $parse(attr.hcFileSelector);

        function createInput() {
          var input = document.createElement('input');
          input.type = 'file';

          if ('multiple' in attr)
            input.multiple = true;

          if ('accept' in attr)
            input.setAttribute('accept', attr.accept);

          return input;
        }

        return function postLink(scope, elem) {
          var element = elem[0];

          element.addEventListener('click', function() {
            var input = createInput();
            input.addEventListener('change', function() {
              onChange(scope, { $files: input.files });
            });
            input.click();
          });
        };
      }
    };
  });

  module.directive('hcFileSelect', function($parse) {
    return {
      restrict: 'A',
      compile: function(elem, attr) {
        var model, onChange;

        if (attr.ngModel)
          model = $parse(attr.ngModel).assign;

        if (attr.hcFileSelect)
          onChange = $parse(attr.hcFileSelect);

        return function postLink(scope, elem) {
          var element = elem[0];

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
