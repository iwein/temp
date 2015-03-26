define(function(require) {
  'use strict';
  var parser = require('./target-parser');
  var module = require('app-module');


  module.directive('hcCandidateTarget', function() {
    return {
      template: require('text!./target.html'),
      scope: { model: '=' },
      link: function(scope) {
        scope.$watch('model.$revision', function() {
          scope.data = parser.get(scope.model);
        });
      }
    };
  });
});
