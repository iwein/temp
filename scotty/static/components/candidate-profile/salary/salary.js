define(function(require) {
  'use strict';
  require('components/element-preferred-location/element-preferred-location');
  var parser = require('./salary-parser');
  var module = require('app-module');


  module.directive('hcCandidateSalary', function() {
    return {
      template: require('text!./salary.html'),
      scope: {
        model: '=',
        hideSalary: '=',
      },
      link: function(scope, elem) {
        scope.$watch('model.$revision', function() {
          scope.data = parser.get(scope.model);
          scope.skills = (scope.data.skills || []).join(', ');
          elem.parent()[isEmpty() ? 'addClass' : 'removeClass']('empty');
        });

        function isEmpty() {
          return !(scope.data && (scope.data.locations || scope.data.salary));
        }
      }
    };
  });
});
