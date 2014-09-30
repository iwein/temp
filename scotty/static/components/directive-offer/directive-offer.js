define(function(require) {
  'use strict';
  var angular = require('angular');
  var booleanAttrs = require('tools/boolean-attrs');
  var module = require('app-module');

  module.directive('hcOffer', function() {
    return {
      restrict: 'EA',
      transclude: true,
      template: require('text!./directive-offer.html'),
      scope: {
        model: '=ngModel',
        hcTitle: '@',
        hcHide: '@',
        onStatusChange: '&',
        hcRejectReason: '=',
      },
      link: function(scope, elem, attr) {
        try {
          scope.hide = angular.fromJson(scope.hcHide || '{}');
        } catch (err) {
          throw new Error('Invalid JSON at hc-hide attribute. ' +
            'Remember to use angular\'s expression {{ { key: "value" } }}');
        }

        booleanAttrs(scope, attr, [
          'hcLink',
          'hcPanel',
          'hcActions',
          'hcHireButton',
          'hcRejectButton',
          'hcNextStatus',
          'hcProfileLinks',
        ]);
      },
    };
  });
});
