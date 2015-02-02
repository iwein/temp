define(function(require) {
  'use strict';
  var INTEGER = /^\d*$/;
  var DOTTED_INTEGER = /^\d{1,3}(,\d{3})*$/;
  var NON_DIGIT = /\D/g;
  var LAST_THREE_DIGITS = /^(\d+)(\d\d\d)/;
  var angular = require('angular');
  var module = require('app-module');

  function clean(value) {
    if (value && !INTEGER.test(value))
      return parseInt(value.replace(NON_DIGIT, ''));
    return value;
  }

  function format(value) {
    value = value ? value.toString() : '';
    if (!INTEGER.test(value))
      value = value.replace(NON_DIGIT, '');

    if (!value) return value;
    while (!DOTTED_INTEGER.test(value))
      value = value.replace(LAST_THREE_DIGITS, '$1,$2');

    return value;
  }

  module.filter('dottedInteger', function() {
    return format;
  });

  module.directive('input', function() {
    return {
      restrict: 'E',
      require: 'ngModel',
      compile: function(elem, attr) {
        if (attr.type !== 'dotted-integer') return;

        return function(scope, elem, attr, ctrl) {
          var maxVal;
          var element = elem[0];
          element.addEventListener('keyup', onKeyUp, true);
          element.addEventListener('change', onChange);
          ctrl.$formatters.push(format);
          ctrl.$parsers.push(clean);

          if (attr.max || attr.ngMax) {
            ctrl.$validators.max = function(value) {
              return ctrl.$isEmpty(value) || angular.isUndefined(maxVal) || value <= maxVal;
            };

            attr.$observe('max', updateValidator);
            attr.$observe('ngMax', updateValidator);
          }

          function updateValidator(val) {
            if (angular.isDefined(val) && !angular.isNumber(val))
              val = parseFloat(val, 10);

            maxVal = angular.isNumber(val) && !isNaN(val) ? val : undefined;
            ctrl.$validate();
          }
        };


        function updateElement(element) {
          var value = format(element.value);
          if (value !== element.value);
            element.value = value;
        }

        function onChange(event) {
          updateElement(event.target);
        }

        function onKeyUp(event) {
          var key = event.keyCode;
          //            command            modifiers                   arrows
          var ignore = key === 91 || (15 < key && key < 19) || (37 <= key && key <= 40);
          if (!ignore)
            updateElement(event.target);
        }
      }
    };
  });
});
