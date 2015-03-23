define(function(require) {
  'use strict';
  require('components/element-preferred-location/element-preferred-location');
  require('components/partial-candidate-pic/partial-candidate-pic');
  var _ = require('underscore');
  var angular = require('angular');
  var Date = require('tools/date');
  var module = require('app-module');

  function calcExperience(experience) {
    if (!experience) return 0;
    return experience.reduce(function(sum, entry) {
      var start = Date.parse(entry.start);
      var end = entry.end ? Date.parse(entry.end) : Date.now();
      var offset = Date.epoch();
      var diff = Date.fromTimestamp(end - start);
      var years = diff.getFullYear() - offset.getFullYear();
      var total = sum + years;
      return total < 0 ? 0 : total;
    }, 0);
  }

  module.directive('hcCandidate', function($q) {
    return {
      restrict: 'EA',
      transclude: true,
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
          var data = model._data || model;
          _.extend(scope, {
            years: calcExperience(data.work_experience),
            city: data.contact_city && data.contact_country_iso ?
              (data.contact_city + ', ' + data.contact_country_iso) :
              'Unknown',
            skills: data.skills.slice(0, 9)
          });

          $q.all([
            data.targetPosition || data.target_position || model.getTargetPosition(),
            model.position || data.position || model.getLastPosition(),
          ]).then(function(result) {
            scope.targetPosition = result[0];
            scope.currentPosition = result[1];
          });
        });
      }
    };
  });
});
