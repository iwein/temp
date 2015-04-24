define(function(require) {
  'use strict';
  require('./avatar-partial');
  var _ = require('underscore');
  var module = require('app-module');


  module.directive('hcCandidateAvatarEdit', function() {
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
          close: close,
          edit: edit,
        });


        function edit() {
          scope.editing = true;
          return profile.openForm('avatar');
        }
      }
    };
  });
});
