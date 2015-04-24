define(function(require) {
  'use strict';
  require('tools/file-upload/amazon');
  require('tools/file-upload/file-select-directive');
  var _ = require('underscore');
  var parser = require('./cv-parser');
  var module = require('app-module');


  module.directive('hcCvPartial', function(toaster, Amazon) {
    return {
      template: require('text!./cv-partial.html'),
      scope: {
        model: '=',
        onSave: '&',
      },
      link: function(scope) {
        _.extend(scope, {
          save: save,
        });

        scope.$watch('model.$revision', function() {
          scope.data = parser.get(scope.model);
        });


        function save(files) {
          scope.loading = true;
          return parser.set(scope.model, Amazon, files[0])
            .then(function() { scope.onSave() })
            .catch(toaster.defaultError)
            .finally(function() { scope.loading = false });
        }
      }
    };
  });
});
