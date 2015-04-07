define(function(require) {
  'use strict';
  var _ = require('underscore');
  var module = require('app-module');


  module.directive('hcCompletionCity', function(toaster, ConfigAPI) {
    return {
      template: require('text!./completion-city.html'),
      require: '^hcCandidateCompletion',
      scope: { model: '=' },
      link: function(scope, elem, attr, ctrl) {
        _.extend(scope, {
          searchLocations: ConfigAPI.locationsText,
          setLocation: setLocation,
          close: ctrl.close,
          skip: ctrl.skip,
          save: save,
        });

        scope.$watch('model.$revision', function() {
          var data = scope.model.getDataCached();
          scope.data = data && data.location;
        });


        function setLocation(text) {
          scope.data = ConfigAPI.getLocationFromText(text);
          scope.errorNoLocation = text && !scope.data;
        }

        function save() {
          return scope.model.updateData({ location: scope.data })
            .then(function() { return ctrl.refresh() })
            .catch(toaster.defaultError)
            .finally(function() { scope.loading = false });
        }
      }
    };
  });
});
