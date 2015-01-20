define(function(require) {
  'use strict';
  var module = require('app-module');

  module.directive('hcEmployerLink', function() {
    return {
      require: 'ngModel',
      restrict: 'EA',
      template: require('text!./element-employer-link.html'),
      scope: {
        'class': '@',
        ngModel: '=',
      },
    };
  });
});
