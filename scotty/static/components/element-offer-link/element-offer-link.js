define(function(require) {
  'use strict';
  var module = require('app-module');

  module.directive('hcOfferLink', function() {
    return {
      require: 'ngModel',
      restrict: 'EA',
      transclude: true,
      template: require('text!./element-offer-link.html'),
      scope: {
        'class': '@',
        ngModel: '=',
      },
    };
  });
});
