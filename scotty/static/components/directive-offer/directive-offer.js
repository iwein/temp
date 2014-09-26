define(function(require) {
  'use strict';
  var angular = require('angular');
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

        if ('hcLink' in attr) scope.hcLink = true;
        if ('hcPanel' in attr) scope.hcPanel = true;
        if ('hcActions' in attr) scope.hcActions = true;
        if ('hcHireButton' in attr) scope.hcHireButton = true;
        if ('hcRejectButton' in attr) scope.hcRejectButton = true;
        if ('hcNextStatus' in attr) scope.hcNextStatus = true;
      },
    };
  });
});
