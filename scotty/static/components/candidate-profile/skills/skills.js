define(function(require) {
  'use strict';
  var _ = require('underscore');
  var fn = require('tools/fn');
  var parser = require('./skills-parser');
  var module = require('app-module');


  module.directive('hcCandidateSkills', function(ConfigAPI) {
    var levels = ConfigAPI.skillLevels();

    return {
      template: require('text!./skills.html'),
      scope: { model: '=' },
      link: function(scope, elem) {
        levels.then(function(result) {
          scope.starValues = [ null ].concat(result);
          scope.ready = true;
        });

        scope.$watch('model.$revision', function() {
          var data = parser.get(scope.model);
          _.extend(scope, sortSkills(data));
          elem.parent()[isEmpty(data) ? 'addClass' : 'removeClass']('empty');
        });

        function isEmpty(data) {
          return !(data && data.length);
        }
      }
    };

    function sortSkills(skills) {
      if (!skills) return;

      var leveledSkills = skills.filter(fn.get('level'));
      var unleveledSkills = skills.filter(fn.not(fn.get('level')));

      return {
        leveledSkills: leveledSkills.slice(0, 8),
        unleveledSkills: leveledSkills.slice(8)
          .concat(unleveledSkills)
          .map(fn.get('skill'))
          .join(', '),
      };

    }
  });
});
