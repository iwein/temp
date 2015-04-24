define(function(require) {
  'use strict';
  require('../avatar/avatar-partial');
  var _ = require('underscore');
  var module = require('app-module');


  module.directive('hcCompletionPicture', function() {
    return {
      template: require('text!./completion-picture.html'),
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
