define(function(require) {
  'use strict';
  var parser = require('./privacy-parser');
  var module = require('app-module');


  module.directive('hcCandidatePrivacy', function() {
    return {
      template: require('text!./privacy.html'),
      scope: { model: '=' },
      link: function(scope) {
        scope.$watch('model.$revision', function() {
          scope.data = parser.get(scope.model);
        });
      }
    };
  });
});
