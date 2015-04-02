define(function(require) {
  'use strict';
  require('components/partial-candidate-pic/partial-candidate-pic');
  var parser = require('./avatar-parser');
  var module = require('app-module');


  module.directive('hcCandidateAvatar', function() {
    return {
      template: require('text!./avatar.html'),
      scope: { model: '=' },
      link: function(scope) {
        scope.parser = parser;
      }
    };
  });
});
