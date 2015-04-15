define(function(require) {
  'use strict';
  require('../partials/preferred-locations');
  require('../skills/skills-no-level');
  var _ = require('underscore');
  var parser = require('./salary-parser');
  var module = require('app-module');


  module.directive('hcCandidateSalaryEdit', function(toaster, ConfigAPI) {
    var featuredLocations = [];
    ConfigAPI.featuredLocations().then(function(response) {
      featuredLocations = response;
    });


    return {
      template: require('text!./salary-edit.html'),
      scope: { model: '=', },
      link: function(scope) {
        // For some reason JSHint complains if I move this function to the end
        function close() {
          scope.editing = false;
          return profile.closeForm('salary');
        }


        var profile = scope.profile = scope.$parent.profile;
        _.extend(scope, {
          close: close,
          edit: edit,
          save: save,
        });


        function edit() {
          scope.data = parser.get(scope.model);
          scope.data.locations = scope.data.locations || [];
          scope.editing = true;
          return profile.openForm('salary');
        }

        function save() {
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
