define(function(require) {
  'use strict';
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');


  module.directive('hcSkillsNoLevel', function(ConfigAPI) {
    var featuredSkills = [];
    var featuredPromise = ConfigAPI.featuredSkills().then(function(value) {
      featuredSkills = value;
    });

    return {
      transclude: true,
      template: require('text!./skills-no-level.html'),
      scope: { model: '=' },
      link: function(scope) {
        _.extend(scope, {
          onFeaturedSkillChange: onFeaturedSkillChange,
          searchSkills: ConfigAPI.skills,
          onChange: onChange,
        });

        onLoad();


        function onLoad() {
          featuredPromise.then(update);
          scope.$watch('model', update);
        }

        function onFeaturedSkillChange() {
          scope.formSkillsNoLevel.skill.$dirty = true;
          onChange(scope.listed);
        }

        function onChange(listed) {
          var featured = scope.featuredSkills
            .filter(fn.get('selected'))
            .map(fn.get('value'));

          var list = listed || [];
          var isValid = scope.skillSelected = !!(featured.length || list.length);
          scope.model = isValid ? featured.concat(list) : [];
        }

        function update() {
          var skills = (scope.model || []).slice();

          scope.featuredSkills = featuredSkills.map(function(entry) {
            var index = skills.indexOf(entry);
            var selected = index !== -1;
            if (selected)
              skills.splice(index, 1);

            return {
              value: entry,
              selected: selected
            };
          });

          scope.listed = skills;
        }
      }
    };
  });
});
