define(function(require) {
  'use strict';
  var _ = require('underscore');
  var module = require('app-module');


  module.directive('hcCompletionCv', function() {
    return {
      template: require('text!./completion-cv.html'),
      require: '^hcCandidateCompletion',
      scope: { model: '=' },
      link: function(scope, elem, attr, ctrl) {
        _.extend(scope, {
          close: ctrl.close,
          skip: ctrl.skip,
          saved: ctrl.refresh,
        });
      }
    };
  });
});
