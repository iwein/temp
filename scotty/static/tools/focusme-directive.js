define(function(require) {
  'use strict';
  var module = require('app-module');

  module.directive('hcFocusMe', function($timeout, $parse) {
    return {
      //scope: true,   // optionally create a child scope
      link: function(scope, element, attrs) {
        var model = $parse(attrs.hcFocusMe);
        scope.$watch(model, function(value) {
          if (!value) return;
          $timeout(function() {
            element[0].focus();
          });
        });
        // to address @blesh's comment, set attribute value to 'false'
        // on blur event:
        element.bind('blur', function() {
           scope.$apply(model.assign(scope, false));
        });
      }
    };
  });
});
