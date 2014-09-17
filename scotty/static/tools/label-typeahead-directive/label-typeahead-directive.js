define(function(require) {
  'use strict';
  var module = require('app-module');

  function noRender(arg) {
    return arg.$entry;
  }

  module.directive('hcLabelTypeahead', function($q) {
    return {
      restrict: 'EA',
      require: 'ngModel',
      template: require('text!./label-typeahead-directive'),
      scope: {
        name: '@',
        placeholder: '@',
        disabled: '@',
        hcErrorMessage: '@',
        ngModel: '=',
        hcSource: '&',
        hcRender: '&',
        onAdd: '&',
        onRemove: '&',
      },
      controller: function($scope, $attrs) {
        var name = $attrs.name || $attrs.hcLabelTypeahead;
        var data = [];
        var rendered = [];
        var hasRender = 'hcRender' in $attrs;
        $scope.hcRender = hasRender ? $scope.hcRender : noRender;

        $scope.hcAllowNew = 'hcAllowNew' in $attrs;
        $scope.dirty = false;

        if (name)
          $scope.$parent[name] = this;

        $scope.add = add;
        $scope.remove = remove;
        $scope.getSource = getSource;
        $scope.onKeydown = onKeydown;

        $scope.$watch('dirty && !disabled && !input.length && !ngModel.length', function(value) {
          $scope.invalid = this.invalid = value;
        }.bind(this));

        function add(input) {
          $scope.ngModel = $scope.ngModel || [];
          $scope.input = '';

          if (hasRender)
            input = data[rendered.indexOf(input)];

          if ($scope.ngModel.indexOf(input) !== -1)
            return;

          $scope.ngModel.push(input);
          $scope.onAdd({ $value: input });
        }

        function remove(entry, index) {
          $scope.ngModel.splice(index, 1);
          $scope.onRemove({ $value: entry, $index: index });
        }

        function getSource(input) {
          return $q.when($scope.hcSource({ $viewValue: input })).then(function(result) {
            if (hasRender) {
              rendered = result.map(function(value) {
                return $scope.hcRender({ $entry: value });
              });
            }

            data = result;
            return result;
          });
        }

        function onKeydown(event, input) {
          $scope.dirty = true;
          if (!$scope.hcAllowNew || !input || event.keyCode !== 13)
            return;

          $scope.add(input);
          event.preventDefault();
        }
      }
    };
  });
});
