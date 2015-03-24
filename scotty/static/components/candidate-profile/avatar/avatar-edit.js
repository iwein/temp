define(function(require) {
  'use strict';
  require('tools/file-upload/amazon');
  require('tools/file-upload/data-url-directive');
  require('tools/file-upload/file-select-directive');
  var _ = require('underscore');
  var parser = require('./avatar-parser');
  var module = require('app-module');


  module.directive('hcCandidateAvatarEdit', function(Amazon) {
    return {
      template: require('text!./avatar-edit.html'),
      scope: { model: '=', },
      link: function(scope) {
        // For some reason JSHint complains if I move this function to the end
        function close() {
          scope.editing = false;
          return profile.closeForm('avatar');
        }


        var profile = scope.profile = scope.$parent.profile;
        _.extend(scope, {
          parser: parser,
          close: close,
          edit: edit,
          save: save,
        });


        function edit() {
          scope.editing = true;
          return profile.openForm('avatar');
        }

        function save() {
          scope.loading = true;
          return parser.set(scope.model, Amazon, scope.data[0]).then(function() {
            scope.loading = false;
            return close();
          });
        }
      }
    };
  });
});
