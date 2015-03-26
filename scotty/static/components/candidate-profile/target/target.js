define(function(require) {
  'use strict';
  var parser = require('./target-parser');
  var module = require('app-module');


  module.directive('hcCandidateTarget', function() {
    return {
      template: require('text!./target.html'),
      scope: { model: '=' },
      link: function(scope, elem) {
        scope.$watch('model.$revision', function() {
          scope.data = parser.get(scope.model);
          elem.parent()[isEmpty() ? 'addClass' : 'removeClass']('empty');
        });

        function isEmpty() {
          return !scope.data;
        }
      }
    };
  });
});
