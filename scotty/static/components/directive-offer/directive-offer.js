define(function(require) {
  'use strict';
  var angular = require('angular');
  var module = require('app-module');

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
        scope.isActive = ['REJECTED', 'WITHDRAWN', 'EXPIRED'].indexOf(scope.model.status) === -1;
        scope.canBeViewed = ['REJECTED', 'WITHDRAWN', 'EXPIRED', 'STARTED'].indexOf(scope.model.status) === -1;
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
