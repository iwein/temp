define(function(require) {
  'use strict';
  require('../partials/preferred-locations');
  var _ = require('underscore');
  var module = require('app-module');


  module.directive('hcCompletionLocation', function(toaster) {
    return {
      template: require('text!./completion-location.html'),
      require: '^hcCandidateCompletion',
      scope: { model: '=' },
      link: function(scope, elem, attr, ctrl) {
        _.extend(scope, {
          close: ctrl.close,
          skip: ctrl.skip,
          save: save,
          data: {},
        });

        scope.$watch('data', function() {
          scope.errorLocationRequired = false;
        });
        scope.$watch('model.$revision', function() {
          var data = scope.model.getDataCached();
          scope.data = data && data.preferred_location;
        });


        function validate() {
          var countries = Object.keys(scope.data || {});
          if (!countries.length)
            scope.errorLocationRequired = true;
        }

        function save() {
          validate();
          if (scope.errorLocationRequired)
            return;

          return scope.model.setPreferredLocations(scope.data)
            .then(function() { return scope.model.getData() })
            .then(function() { return ctrl.refresh() })
            .catch(toaster.defaultError)
            .finally(function() { scope.loading = false });
        }
      }
    };
  });
});
