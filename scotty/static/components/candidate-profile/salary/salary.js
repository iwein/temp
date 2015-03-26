define(function(require) {
  'use strict';
  require('components/element-preferred-location/element-preferred-location');
  var parser = require('./salary-parser');
  var module = require('app-module');


  module.directive('hcCandidateSalary', function() {
    return {
      template: require('text!./salary.html'),
      scope: { model: '=' },
      link: function(scope) {
        scope.$watch('model.$revision', function() {
          scope.data = parser.get(scope.model);
        });
      }
    };
  });
});
