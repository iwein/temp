define(function(require) {
  'use strict';
  require('components/directive-education-form/directive-education-form');
  var _ = require('underscore');
  var module = require('app-module');


  module.directive('hcCompletionEducationFurther', function(toaster) {
    return {
      template: require('text!./completion-education-further.html'),
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
          return scope.model.noFurtherEducation()
            .catch(toaster.defaultError)
            .finally(function() { scope.loading = false });
        }

        function save(model, form) {
          scope.loading = true;
          return form.save()
            .then(function() { return scope.model.getEducation() })
            .then(function() { return form.reset() })
            .catch(toaster.defaultError)
            .finally(function() { scope.loading = false });
        }
      }
    };
  });
});
