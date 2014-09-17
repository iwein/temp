define(function(require) {
  'use strict';
  require('tools/config-api');
  var angular = require('angular');
  var module = require('app-module');

  function calcExperience(experience) {
    if (!experience) return 0;
    return experience.reduce(function(sum, entry) {
      var start = new Date(entry.start);
      var end = new Date(entry.end);
      var offset = new Date(0);
      var diff = new Date(end - start);
      var years = diff.getFullYear() - offset.getFullYear();
      return sum + years;
    }, 0);
  }

  module.directive('hcCandidate', function(ConfigAPI) {
    return {
      restrict: 'EA',
      template: require('text!./directive-candidate.html'),
      scope: {
        model: '=ngModel',
        hcHide: '@'
      },
      link: function(scope) {
        try {
          scope.hide = angular.fromJson(scope.hcHide || '{}');
        } catch (err) {
          throw new Error('Invalid JSON at hc-hide attribute. ' +
            'Remember to use angular\'s expression {{ { key: "value" } }}');
        }

        scope.$watch('model', function(model) {
          scope.candidate = {
            id: model.id,
            name: model.first_name + ' ' + model.last_name,
            city: ConfigAPI.locationToText(model.contact_city),
            years: calcExperience(model.work_experience),
            skills: model.skills.map(function(item) {
              return item.skill;
            }).join(', '),
          };
        });
      },
    };
  });
});
