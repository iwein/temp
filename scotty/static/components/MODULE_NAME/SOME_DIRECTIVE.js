define(function(require) {
  'use strict';
  var module = require('app-module');

  module.directive('SOME_DIRECTIVE', function() {
    return {
      restrict: 'E',
      scope: {
        model: '=ngModel',
        text: '@message',
        onSomething: '&',
        //onSomething: '&onSomething',
      },

      compile: function(elem, attr) {
        console.log(elem, attr);
        // ...

        return function postLink(scope) {
          console.log(scope);
          // ...
        };
      },
    };
  });
});
