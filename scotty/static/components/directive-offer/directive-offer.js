define(function(require) {
  'use strict';
  var angular = require('angular');
  var module = require('app-module');
  var fn = require('tools/fn');
  require('components/partial-candidate-pic/partial-candidate-pic');

  module.directive('hcOffer', function() {
    return {
      restrict: 'EA',
      template: require('text!./directive-offer.html'),
      scope: {
        model: '=ngModel',
        hcHide: '@',
        hcDisabled: '='
      },
      link: function(scope) {
        var candidate = scope.model.data.candidate;

        if(candidate && candidate.skills){
          var leveledSkills = candidate.skills.filter(fn.get('level'));
          scope.skills = leveledSkills.slice(0, 9);
        } else
          scope.skills = [];

        scope.isActive = ['REJECTED', 'WITHDRAWN', 'EXPIRED'].indexOf(scope.model.status) === -1 && !scope.hcDisabled;
        scope.canBeViewed = ['REJECTED', 'WITHDRAWN', 'EXPIRED', 'STARTED'].indexOf(
          scope.model.status) === -1 && !scope.hcDisabled;
        try {
          scope.hide = angular.fromJson(scope.hcHide || '{}');
        } catch (err) {
          throw new Error('Invalid JSON at hc-hide attribute. ' +
            'Remember to use angular\'s expression {{ { key: "value" } }}');
        }
      }
    };
  });
});
