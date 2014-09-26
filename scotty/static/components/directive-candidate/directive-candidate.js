define(function(require) {
  'use strict';
  var angular = require('angular');
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

        if ('hcLinkProfile' in attr) scope.hcLinkProfile = true;

        scope.$watch('model', function(model) {
          scope.candidate = {
            id: model.id,
            picture_url: model.picture_url,
            name: model.first_name + ' ' + model.last_name,
            city: model.contact_city && model.contact_country_iso ?
              (model.contact_city + ', ' + model.contact_country_iso) :
              'Unknown',
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
