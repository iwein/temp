define(function(require) {
  'use strict';
  require('tools/validate-on-submit-directive');
  require('../skills/skills-no-level');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');


  module.directive('hcCandidateCompletionTarget', function(toaster, ConfigAPI) {
    var roles = ConfigAPI.featuredRoles();

    return {
      template: require('text!./completion-target.html'),
      require: '^hcCandidateCompletion',
      scope: { model: '=' },
      link: function(scope, elem, attr, ctrl) {
        roles.then(fn.setTo('featuredRoles', scope));
        _.extend(scope, {
          data: scope.model.getTargetPositionCached(),
          close: ctrl.close,
          skip: ctrl.skip,
          save: save,
        });


        function save() {
          var skills = scope.data.skills;
          if (!(skills && skills.length))
            return;

          scope.loading = true;
          return scope.model.setTargetPosition(scope.data)
            .then(function() { return scope.model.getTargetPosition() })
            .then(function() { return ctrl.refresh() })
            .catch(toaster.defaultError)
            .finally(function() { scope.loading = false });
        }
      }
    };
  });
});
