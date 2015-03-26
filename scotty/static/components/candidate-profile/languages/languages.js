define(function(require) {
  'use strict';
  var parser = require('./languages-parser');
  var module = require('app-module');


  module.directive('hcCandidateLanguages', function() {
    return {
      template: require('text!./languages.html'),
      scope: { model: '=' },
      link: function(scope, elem) {
        scope.$watch('model.$revision', function() {
          scope.data = parser.get(scope.model);
          elem.parent()[isEmpty() ? 'addClass' : 'removeClass']('empty');
        });

        function isEmpty() {
          return !(scope.data && scope.data.length);
        }
      }
    };
  });
});

