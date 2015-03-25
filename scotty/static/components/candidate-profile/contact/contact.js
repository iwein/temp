define(function(require) {
  'use strict';
  var parser = require('./contact-parser');
  var module = require('app-module');


  module.directive('hcCandidateContact', function() {
    return {
      template: require('text!./contact.html'),
      scope: { model: '=' },
      link: function(scope) {
        scope.$watch('model.$revision', function() {
          scope.data = parser.get(scope.model);
        });
      }
    };
  });
});
