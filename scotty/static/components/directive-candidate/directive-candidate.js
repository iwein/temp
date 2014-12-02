define(function(require) {
  'use strict';
  var _ = require('underscore');
  var angular = require('angular');
  var booleanAttrs = require('tools/boolean-attrs');
  var module = require('app-module');

  function calcExperience(experience) {
    if (!experience) return 0;
    return experience.reduce(function(sum, entry) {
      var start = new Date(entry.start);
      var end = entry.end ? new Date(entry.end) : new Date();
      var offset = new Date(0);
      var diff = new Date(end - start);
      var years = diff.getFullYear() - offset.getFullYear();
      var total = sum + years;
      return total < 0 ? 0 : total;
    }, 0);
  }

  module.directive('hcCandidate', function($q) {
    return {
      restrict: 'EA',
      template: require('text!./directive-candidate.html'),
      scope: {
        model: '=ngModel',
        hcHide: '@'
      },
      link: function(scope, elem, attr) {
        try {
          scope.hide = angular.fromJson(scope.hcHide || '{}');
        } catch (err) {
          throw new Error('Invalid JSON at hc-hide attribute. ' +
            'Remember to use angular\'s expression {{ { key: "value" } }}');
        }

        booleanAttrs(scope, attr, [ 'hcLinkProfile' ]);

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
            data.targetPosition || model.getTargetPosition(),
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
