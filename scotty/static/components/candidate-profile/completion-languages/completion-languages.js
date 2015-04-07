define(function(require) {
  'use strict';
  require('../languages/languages-partial');
  var _ = require('underscore');
  var module = require('app-module');


  module.directive('hcCompletionLanguages', function() {
    return {
      template: require('text!./completion-languages.html'),
      require: '^hcCandidateCompletion',
      scope: { model: '=' },
      link: function(scope, elem, attr, ctrl) {
        _.extend(scope, {
          saved: ctrl.refresh,
          close: ctrl.close,
          skip: ctrl.skip,
          data: {},
        });
      }
    };
  });
});
