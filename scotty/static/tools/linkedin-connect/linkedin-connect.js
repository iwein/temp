define(function(require) {
  'use strict';
  var module = require('app-module');

  module.directive('hcLinkedinConnect', function() {
    return {
      restrict: 'EA',
      template: require('text!./linkedin-connect.html'),
    };
  });
});
