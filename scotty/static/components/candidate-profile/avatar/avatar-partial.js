define(function(require) {
  'use strict';
  require('tools/file-upload/amazon');
  require('tools/file-upload/data-url-directive');
  require('tools/file-upload/file-select-directive');
  var _ = require('underscore');
  var parser = require('./avatar-parser');
  var module = require('app-module');


  module.directive('hcAvatarPartial', function(toaster, Amazon) {
    return {
      transclude: true,
      template: require('text!./avatar-partial.html'),
      scope: {
        model: '=',
        onSave: '&',
      },
      link: function(scope, elem) {
        _.extend(scope, {
          parser: parser,
          save: save,
        });

        scope.$watch('selectedPicture', function(value) {
          var button = elem[0].querySelector('button[type=submit]');
          if (value && value.length)
            button.removeAttribute('disabled');
          else
            button.setAttribute('disabled', 'disabled');
        });


        function save() {
          scope.loading = true;
          return parser.set(scope.model, Amazon, scope.data[0])
            .then(function() { return scope.onSave() })
            .catch(toaster.defaultError)
            .finally(function() { scope.loading = false });
        }
      }
    };
  });
});
