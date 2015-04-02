define(function(require) {
  'use strict';
  var parser = require('./summary-parser');
  var module = require('app-module');


  module.directive('hcCandidateSummary', function() {
    return {
      template: require('text!./summary.html'),
      scope: { model: '=' },
      link: function(scope) {
        scope.$watch('model.$revision', function() {
          scope.data = parser.get(scope.model);
        });
      }
    };
  });
});
