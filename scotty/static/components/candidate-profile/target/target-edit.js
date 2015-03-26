define(function(require) {
  'use strict';
  var _ = require('underscore');
  var fn = require('tools/fn');
  var parser = require('./target-parser');
  var module = require('app-module');


  module.directive('hcCandidateTargetEdit', function(ConfigAPI) {
    var featured = ConfigAPI.featuredRoles();

    return {
      template: require('text!./target-edit.html'),
      scope: { model: '=', },
      link: function(scope) {
        // For some reason JSHint complains if I move this function to the end
        function close() {
          scope.editing = false;
          return profile.closeForm('target');
        }


        var profile = scope.profile = scope.$parent.profile;
        featured.then(fn.setTo('featuredRoles', scope));
        _.extend(scope, {
          close: close,
          edit: edit,
          save: save,
        });


        function edit() {
          scope.data = parser.get(scope.model);
          scope.editing = true;
          return profile.openForm('target');
        }

        function save() {
          scope.loading = true;
          return parser.set(scope.model, scope.data)
            .then(close)
            .finally(function() { scope.loading = false });
        }
      }
    };
  });
});
