define(function(require) {
  'use strict';
  require('../partials/preferred-locations');
  var _ = require('underscore');
  var module = require('app-module');


  module.directive('hcCompletionLocation', function(toaster) {
    return {
      template: require('text!./completion-location.html'),
      scope: {
        model: '=',
        onSubmit: '&',
      },
      link: function(scope) {
        _.extend(scope, {
          save: save,
          data: {},
        });

        scope.$watch('model.$revision', function() {
          var data = scope.model.getDataCached();
          scope.data = data && data.preferred_location;
        });


        function save() {
          return scope.model.setPreferredLocations(scope.data)
            .then(function() { return scope.model.getData() })
            .then(function() { return scope.onSubmit() })
            .catch(toaster.defaultError)
            .finally(function() { scope.loading = false });
        }
      }
    };
  });
});
