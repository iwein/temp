define(function(require) {
  'use strict';
  require('components/directive-education-form/directive-education-form');
  var _ = require('underscore');
  var module = require('app-module');


  module.directive('hcCompletionEducation', function(toaster) {
    return {
      template: require('text!./completion-education.html'),
      require: '^hcCandidateCompletion',
      scope: { model: '=' },
      link: function(scope, elem, attr, ctrl) {
        _.extend(scope, {
          skip: ctrl.skip,
          save: save,
          data: {},
        });


        function save(model, form) {
          return form.save()
            .then(function() { return scope.model.getEducation() })
            .then(function() { return ctrl.refresh() })
            .catch(toaster.defaultError)
            .finally(function() { scope.loading = false });
        }
      }
    };
  });
});
