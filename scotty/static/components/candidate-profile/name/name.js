define(function(require) {
  'use strict';
  var parser = require('./name-parser');
  var module = require('app-module');


  module.directive('hcCandidateName', function() {
    return {
      template: require('text!./name.html'),
      scope: { model: '=' },
      link: function(scope) {
        scope.$watch('model.$revision', function() {
          scope.data = parser.get(scope.model);
        });
      }
    };
  });
});
