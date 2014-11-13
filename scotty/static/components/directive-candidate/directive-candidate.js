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

  var levels = {
    'null': 0,
    'undefined': 0,
    'basic': 1,
    'advanced': 2,
    'expert': 3,
  };

  module.directive('hcCandidate', function() {
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
            currentPosition: data.work_experience[data.work_experience.length - 1],
            years: calcExperience(data.work_experience),
            city: data.contact_city && data.contact_country_iso ?
              (data.contact_city + ', ' + data.contact_country_iso) :
              'Unknown',
            skills: data.skills.sort(function(a, b) {
              return levels[b.level] - levels[a.level];
            }).slice(9),
          });
        });
      },
    };
  });
});
