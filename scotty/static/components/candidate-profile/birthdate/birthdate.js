define(function(require) {
  'use strict';
  var parser = require('./birthdate-parser');
  var module = require('app-module');


  module.directive('hcCandidateBirthdate', function() {
    return {
      template: require('text!./birthdate.html'),
      scope: { model: '=' },
      link: function(scope) {
        scope.$watch('model.$revision', function() {
          scope.data = parser.get(scope.model);
        });
      }
    };
  });
});

