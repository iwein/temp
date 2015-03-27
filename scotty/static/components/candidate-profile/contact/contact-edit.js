define(function(require) {
  'use strict';
  var _ = require('underscore');
  var parser = require('./contact-parser');
  var module = require('app-module');


  module.directive('hcCandidateContactEdit', function(toaster, ConfigAPI) {
    return {
      template: require('text!./contact-edit.html'),
      scope: { model: '=', },
      link: function(scope) {
        // For some reason JSHint complains if I move this function to the end
        function close() {
          scope.editing = false;
          return profile.closeForm('contact');
        }


        var profile = scope.profile = scope.$parent.profile;
        _.extend(scope, {
          searchLocations: ConfigAPI.locationsText,
          setLocation: setLocation,
          close: close,
          edit: edit,
          save: save,
        });


        function setLocation(text) {
          scope.data.location = ConfigAPI.getLocationFromText(text);
          scope.errorNoLocation = text && !scope.data.location;
        }

        function edit() {
          scope.data = parser.get(scope.model);
          scope.editing = true;

          if (scope.data.location)
            scope.locationText = ConfigAPI.locationToText(scope.data.location);

          return profile.openForm('contact');
        }

        function save() {
          if (scope.errorNoLocation)
            return;

          scope.loading = true;
          return parser.set(scope.model, scope.data)
            .then(close)
            .catch(toaster.defaultError)
            .finally(function() { scope.loading = false });
        }
      }
    };
  });
});
