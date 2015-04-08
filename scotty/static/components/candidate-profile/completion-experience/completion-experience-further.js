define(function(require) {
  'use strict';
  require('components/directive-experience-form/directive-experience-form');
  var _ = require('underscore');
  var module = require('app-module');


  module.directive('hcCompletionExperienceFurther', function(toaster) {
    return {
      template: require('text!./completion-experience-further.html'),
      require: '^hcCandidateCompletion',
      scope: { model: '=' },
      link: function(scope, elem, attr, ctrl) {
        _.extend(scope, {
          close: ctrl.close,
          skip: skip,
          save: save,
          data: {},
        });

        function skip() {
          scope.loading = false;
          return scope.model.noFurtherExperience()
            .catch(toaster.defaultError)
            .finally(function() { scope.loading = false });
        }

        function save(model, form) {
          scope.loading = true;
          return form.save()
            .then(function() { return scope.model.getExperience() })
            .then(function() { return form.reset() })
            .catch(toaster.defaultError)
            .finally(function() { scope.loading = false });
        }
      }
    };
  });
});
