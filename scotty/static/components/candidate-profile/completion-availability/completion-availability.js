define(function(require) {
  'use strict';
  var _ = require('underscore');
  var parser = require('../availability/availability-parser');
  var module = require('app-module');


  module.directive('hcCompletionAvailability', function(toaster) {
    return {
      template: require('text!./completion-availability.html'),
      require: '^hcCandidateCompletion',
      scope: { model: '=' },
      link: function(scope, elem, attr, ctrl) {
        _.extend(scope, {
          close: ctrl.close,
          skip: ctrl.skip,
          save: save,
        });

        scope.$watch('model.$revision', function() {
          scope.data = parser.get(scope.model);
        });


        function save() {
          scope.loading = true;
          return parser.set(scope.model, scope.data)
            .then(function() { return ctrl.refresh() })
            .catch(toaster.defaultError)
            .finally(function() { scope.loading = false });
        }
      }
    };
  });
});
