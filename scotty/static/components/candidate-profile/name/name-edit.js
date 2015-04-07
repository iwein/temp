define(function(require) {
  'use strict';
  var _ = require('underscore');
  var parser = require('./name-parser');
  var module = require('app-module');


  module.directive('hcCandidateNameEdit', function(toaster) {
    return {
      template: require('text!./name-edit.html'),
      scope: { model: '=', },
      link: function(scope) {
        // For some reason JSHint complains if I move this function to the end
        function close() {
          scope.editing = false;
          return profile.closeForm('name');
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
          return profile.openForm('name');
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
