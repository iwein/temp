define(function(require) {
  'use strict';
  var nameAttr = require('tools/name-attr');
  var module = require('app-module');

  module.directive('hcAccordion', function() {
    return {
      restrict: 'E',
      transclude: true,
      template: require('text!./accordion-directive.html'),
      scope: {
        hcHideControl: '=',
      },
      controllerAs: 'accordion',
      controller: function($scope, $attrs) {
        function open() {
          $scope.open = true;
        }

        function close() {
          $scope.open = false;
        }

        this.open = open;
        this.close = close;
        $scope.open = false;

        nameAttr(this, 'hcExperience', $scope, $attrs);
      }
    };
  });
});
