define(function(require) {
  'use strict';
  require('tools/file-upload/file-select-directive');
  var _ = require('underscore');
  var parser = require('./cv-parser');
  var module = require('app-module');


  module.directive('hcCandidateCvEdit', function(toaster, Amazon) {
    return {
      template: require('text!./cv-edit.html'),
      scope: { model: '=', },
      link: function(scope) {
        // For some reason JSHint complains if I move this function to the end
        function close() {
          scope.editing = false;
          return profile.closeForm('cv');
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
          return profile.openForm('cv');
        }

        function save(files) {
          scope.loading = true;
          return parser.set(scope.model, Amazon, files[0])
            .then(close)
            .catch(toaster.defaultError)
            .finally(function() { scope.loading = false });
        }
      }
    };
  });
});
