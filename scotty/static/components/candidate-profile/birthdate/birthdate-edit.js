define(function(require) {
  'use strict';
  var _ = require('underscore');
  var parser = require('./birthdate-parser');
  var module = require('app-module');


  module.directive('hcCandidateBirthdateEdit', function() {
    return {
      template: require('text!./birthdate-edit.html'),
      scope: { model: '=', },
      link: function(scope) {
        // For some reason JSHint complains if I move this function to the end
        function close() {
          scope.editing = false;
          return profile.closeForm('birthdate');
        }


        var profile = scope.profile = scope.$parent.profile;
        _.extend(scope, {
          close: close,
          edit: edit,
          save: save,
        });


        function edit() {
          scope.data = parser.get(scope.model);
          scope.editing = true;
          return profile.openForm('birthdate');
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
