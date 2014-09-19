define(function(require) {
  'use strict';
  require('tools/config-api');
  var angular = require('angular');
  var module = require('app-module');

  module.directive('hcEmployer', function() {
    return {
      restrict: 'EA',
      template: require('text!./directive-employer.html'),
      scope: {
        employer: '=ngModel',
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
      },
    };
  });
});
