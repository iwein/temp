define(function(require) {
  'use strict';
  require('components/directive-experience-form/directive-experience-form');
  var _ = require('underscore');
  var module = require('app-module');


  module.directive('hcCompletionExperience', function(toaster) {
    return {
      template: require('text!./completion-experience.html'),
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
            .then(function() { return scope.model.getExperience() })
            .then(function() { return ctrl.refresh() })
            .catch(toaster.defaultError)
            .finally(function() { scope.loading = false });
        }
      }
    };
  });
});
