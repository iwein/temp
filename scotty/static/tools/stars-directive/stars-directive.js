define(function(require) {
  'use strict';
  var module = require('app-module');

  module.directive('hcStars', function() {
    return {
      restrict: 'E',
      template: require('text!./stars-directive.html'),
      scope: {
        hcValue: '@',
        ngModel: '=',
        hcValues: '=',
      },
      link: function(scope) {
        function update() {
          var stars = scope.hcValues.length - 1;
          var value = scope.hcValue || scope.ngModel;
          var index = scope.hcValues.indexOf(value);
          var enabled = index === -1 ? 0 : index;
          var model = [];
          scope.model = model;

          for (var i = 0; i < stars; i++)
            model.push({ value: i < enabled });
        }

        update();
      }
    };
  });
});
