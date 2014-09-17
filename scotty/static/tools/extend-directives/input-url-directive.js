define(function(require) {
  'use strict';
  var NO_PROTOCOL_URL_REGEXP =
    /^((\w|\d)+(:(\w|\d)+)?@)?(((\w|\d)+\.)+(\w|\d)+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/])+)?$/;
  var module = require('app-module');

  module.directive('input', function($parse) {
    return {
      restrict: 'E',
      require: '?ngModel',
      compile: function(elem, attr) {
        if (attr.type !== 'url' || !attr.ngModel)
          return;

        var element = elem[0];
        var model = $parse(attr.ngModel);
        var apply = function() { };

        element.addEventListener('blur', function() {
          var value = element.value;
          if (NO_PROTOCOL_URL_REGEXP.test(value)) {
            value = 'http://' + value;
            element.value = value;
            apply(value);
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
