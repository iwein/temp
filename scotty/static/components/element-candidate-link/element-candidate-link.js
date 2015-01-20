define(function(require) {
  'use strict';
  var module = require('app-module');

  module.directive('hcCandidateLink', function() {
    return {
      require: 'ngModel',
      restrict: 'EA',
      template: require('text!./element-candidate-link.html'),
      scope: {
        'class': '@',
        ngModel: '=',
      },
    };
  });
});
