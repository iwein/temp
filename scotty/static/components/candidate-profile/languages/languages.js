define(function(require) {
  'use strict';
  var parser = require('./languages-parser');
  var module = require('app-module');


  module.directive('hcCandidateLanguages', function() {
    return {
      template: require('text!./languages.html'),
      scope: { model: '=' },
      link: function(scope) {
        scope.$watch('model.$revision', function() {
          scope.data = parser.get(scope.model);
        });
      }
    };
  });
});

