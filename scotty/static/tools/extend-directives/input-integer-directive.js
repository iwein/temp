define(function(require) {
  'use strict';
  var INTEGER = /^\d*$/;
  var DOTTED_INTEGER = /^\d{1,3}(,\d{3})*$/;
  var NON_DIGIT = /\D/g;
  var LAST_THREE_DIGITS = /^(\d+)(\d\d\d)/;
  var module = require('app-module');

  function format(value) {
    value = value ? value.toString() : '';
    if (!INTEGER.test(value))
      value = value.replace(NON_DIGIT, '');

    if (!value) return value;
    while (!DOTTED_INTEGER.test(value))
      value = value.replace(LAST_THREE_DIGITS, '$1,$2');

    return value;
  }

  module.directive('input', function() {
    return {
      restrict: 'E',
      require: 'ngModel',
      compile: function(elem, attr) {
        if (attr.type !== 'dotted-integer') return;
        var element = elem[0];

        element.addEventListener('keyup', function(event) {
          var key = event.keyCode;
          // ignore
          //    command            modifiers                   arrows
          if (key === 91 || (15 < key && key < 19) || (37 <= key && key <= 40)) return;

          var value = format(element.value);
          if (value !== element.value);
            element.value = value;
        }, true);

        return function(scope, elem, attr, ctrl) {
          ctrl.$parsers.push(format);
          ctrl.$formatters.push(format);
        };
      }
    };
  });
});


/*


        return function(scope) {
          scope.$watch(attr.ngModel, function(value) {
            console.log('RECEIVED', value);
            if (!value || DOTTED_INTEGER.test(value)) return value;
            value = value.toString();


            model.assign(value);
            console.log('PARSED', value);
          });
        };
      },

      compileasdfasdf: function(elem, attr) {

        element.addEventListener('keyup', function() {
          var value = element.value;
          if (!value) return;

          debugger;

          if (value !== element.value) {
            element.value = value;
            //apply(value);
          }
        });

        return function postLink(scope) {
          apply = function(value) {
            scope.$apply(function() {
              model.assign(scope, value);
            });
          };
        };
      }
    };
  });
});
*/
