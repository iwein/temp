define(function(require) {
  'use strict';
  var module = require('app-module');

  module.directive('hcCandidatePic', function() {
    return {
      scope: {
        pictureUrl: '=',
        classes: '@'
      },
      template: require('text!./partial-candidate-pic.html')
    };
  });
});
