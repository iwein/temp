define(function(require) {
  'use strict';
  var _ = require('underscore');
  var fn = require('tools/fn');
  var parser = require('./skills-parser');
  var module = require('app-module');


  module.directive('hcSkillsPartial', function(toaster, ConfigAPI) {
    var levels = ConfigAPI.skillLevels();

    return {
      transclude: true,
      template: require('text!./skills-partial.html'),
      scope: {
        model: '=',
        onSave: '&',
      },
      link: function(scope, elem) {
        _.extend(scope, {
          searchSkills: searchSkills,
          onChange: recheck,
          onBlur: onBlur,
          recheck: recheck,
          remove: remove,
          save: save,
        });

        levels.then(onLoad);


        function onLoad(levels) {
          var skills = parser.get(scope.model);

          scope.levels = levels;
          scope.data = skills.filter(fn.get('level'));
          scope.skills = skills
            .filter(fn.not(fn.get('level')))
            .map(fn.get('skill'));

          if (!skills.length)
            scope.data = prefill(scope.model);

          recheck();
        }

        function save() {
          if (!scope.isValid) return;

          var data = _.uniq(getSkills(), false, fn.get('skill'));
          scope.loading = true;

          return parser.set(scope.model, data)
            .then(function() { return scope.onSave() })
            .catch(toaster.defaultError)
            .finally(function() { scope.loading = false });
        }

        function recheck() {
          for (var i = scope.data.length; i--; ) {
            if (!scope.data[i].skill)
              scope.data.splice(i, 1);
          }

          scope.isValid = scope.data.length >= 3 && scope.data.every(function(entry) {
            return typeof entry.level === 'string';
          });

          var button = elem[0].querySelector('button[type=submit]');
          if (scope.isValid)
            button.removeAttribute('disabled');
          else
            button.setAttribute('disabled', 'disabled');

          if (scope.data.length > 2)
            scope.data.push({});
          else while (scope.data.length < 3)
            scope.data.push({});
        }

        function getSkills() {
          var withLevel = scope.data.filter(function(skill) {
            return !!skill.skill;
          });
          var withoutLevel = scope.skills.map(function(skill) {
            return { skill: skill, level: null };
          });
          return withLevel.concat(withoutLevel);
        }

        function searchSkills(term) {
          var skills = getSkills().map(fn.get('skill'));

          return ConfigAPI.skills(term).then(function(data) {
            return data.filter(function(entry) {
              return skills.indexOf(entry) === -1;
            });
          });
        }

        function remove(index) {
          scope.data.splice(index, 1);
          recheck();
        }

        function onBlur(entry, index) {
          if (!entry.skill)
            remove(index);
          recheck();
        }

        function prefill(candidate) {
          var targetPosition = candidate.getTargetPositionCached() || {};
          var experience = candidate.getExperienceCached() || [];

          var skills = experience.reduce(function(all, entry) {
            return all.concat(entry.skills);
          }, targetPosition.skills || []);

          return _.uniq(skills).map(function(skill) {
            return { skill: skill };
          });
        }
      }
    };
  });
});
