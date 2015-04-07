define(function(require) {
  'use strict';
  require('../skills/skills-partial');
  var _ = require('underscore');
  var module = require('app-module');


  module.directive('hcCompletionSkills', function() {
    return {
      template: require('text!./completion-skills.html'),
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
