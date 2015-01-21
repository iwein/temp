define(function(require) {
  'use strict';
  var module = require('app-module');

  module.directive('hcXingConnect', function() {
    return {
      restrict: 'EA',
      template: require('text!./xing-connect.html'),
    };
  });
});
