define(function(require) {
  'use strict';
  require('./languages-partial');
  var _ = require('underscore');
  var module = require('app-module');


  module.directive('hcCandidateLanguagesEdit', function() {
    return {
      template: require('text!./languages-edit.html'),
      scope: { model: '=', },
      link: function(scope) {
        // For some reason JSHint complains if I move this function to the end
        function close() {
          scope.editing = false;
          return profile.closeForm('languages');
        }

        var profile = scope.profile = scope.$parent.profile;
        _.extend(scope, {
          close: close,
          edit: edit,
        });


        function edit() {
          scope.editing = true;
          return profile.openForm('skills');
        }
      }
    };
  });
});
