define(function(require) {
  'use strict';
  require('components/partial-candidate-pic/partial-candidate-pic');
  var parser = require('./salary-parser');
  var module = require('app-module');


  module.directive('hcCandidateSalary', function() {
    return {
      template: require('text!./salary.html'),
      scope: { model: '=' },
      link: function(scope) {
        scope.parser = parser;
      }
    };
  });
});
