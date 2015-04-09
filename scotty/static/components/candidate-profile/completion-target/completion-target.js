define(function(require) {
  'use strict';
  require('tools/validate-on-submit-directive');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');


  module.directive('hcCandidateCompletionTarget', function(toaster, ConfigAPI) {
    var roles = ConfigAPI.featuredRoles();
    var skills = ConfigAPI.featuredSkills();

    return {
      template: require('text!./completion-target.html'),
      require: '^hcCandidateCompletion',
      scope: { model: '=' },
      link: function(scope, elem, attr, ctrl) {
        roles.then(fn.setTo('featuredRoles', scope));
        _.extend(scope, {
          data: scope.model.getTargetPositionCached(),
          onFeaturedSkillChange: onFeaturedSkillChange,
          searchSkills: ConfigAPI.skills,
          close: ctrl.close,
          skip: ctrl.skip,
          save: save,
        });

        skills.then(function(list) {
          scope.featuredSkills = list.map(function(value) {
            return { value: value };
          });
        });


        function save() {
          if (!scope.form.$valid)
            return;

          var data = _.extend({}, scope.data);
          var skills = scope.featuredSkills
            .filter(fn.get('selected'))
            .map(fn.get('value'));

          data.skills = (data.skills || []).concat(skills);
          scope.loading = true;

          return scope.model.setTargetPosition(data)
            .then(function() { return scope.model.getTargetPosition() })
            .then(function() { return ctrl.refresh() })
            .catch(toaster.defaultError)
            .finally(function() { scope.loading = false });
        }

        function onFeaturedSkillChange() {
          scope.form.skill.$dirty = true;
          scope.skillSelected = scope.featuredSkills.some(fn.get('selected'));
        }
      }
    };
  });
});
