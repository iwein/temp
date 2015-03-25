define(function(require) {
  'use strict';
  var parser = require('./cv-parser');
  var module = require('app-module');


  module.directive('hcCandidateCv', function() {
    return {
      template: require('text!./cv.html'),
      scope: { model: '=' },
      link: function(scope) {
        scope.$watch('model.$revision', function() {
          scope.data = parser.get(scope.model);
        });
      }
    };
  });
});
