define(function(require) {
  'use strict';
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');


  module.directive('hcCandidateCompletionTarget', function(toaster, ConfigAPI) {
    var roles = ConfigAPI.featuredRoles();
    var skills = ConfigAPI.featuredSkills();

    return {
      template: require('text!./completion-target.html'),
      scope: { model: '=', },
      link: function(scope) {
        // For some reason JSHint complains if I move this function to the end
        function close() {
          scope.editing = false;
          return profile.closeForm('target');
        }


        var profile = scope.profile = scope.$parent.profile;
        roles.then(fn.setTo('featuredRoles', scope));
        _.extend(scope, {
          onFeaturedSkillChange: onFeaturedSkillChange,
          searchSkills: ConfigAPI.skills,
          close: close,
          edit: edit,
          save: save,
        });

        skills.then(function(list) {
          scope.featuredSkills = list.map(function(value) {
            return { value: value };
          });
        });


        function edit() {
          scope.data = scope.model.getTargetPositionCached();
          scope.editing = true;
          return profile.openForm('target');
        }

        function save() {
          var data = _.extend({}, scope.data);
          var skills = scope.featuredSkills
            .filter(fn.get('selected'))
            .map(fn.get('value'));

          data.skills = (data.skills || []).concat(skills);
          scope.loading = true;

          return scope.model.setTargetPosition(data)
            .then(function() { return scope.model.getTargetPosition() })
            .then(close)
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
