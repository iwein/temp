define(function(require) {
  'use strict';
  require('../birthdate/birthdate-partial');
  var _ = require('underscore');
  var module = require('app-module');


  module.directive('hcCompletionBirthdate', function(toaster) {
    return {
      template: require('text!./completion-birthdate.html'),
      require: '^hcCandidateCompletion',
      scope: { model: '=' },
      link: function(scope, elem, attr, ctrl) {
        _.extend(scope, {
          close: ctrl.close,
          skip: ctrl.skip,
          save: save,
        });

        scope.$watch('model.$revision', function() {
          var data = scope.model.getDataCached();
          scope.data = data && data.dob;
        });


        function save() {
          return scope.model.updateData({ dob: scope.data })
            .then(function() { return ctrl.refresh() })
            .catch(toaster.defaultError)
            .finally(function() { scope.loading = false });
        }
      }
    };
  });
});
