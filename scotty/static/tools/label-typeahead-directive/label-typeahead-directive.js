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
      template: require('text!./label-typeahead-directive.html'),
      scope: {
        name: '@',
        placeholder: '@',
        disabled: '@',
        hcErrorMessage: '@',
        ngModel: '=',
        hcRequired: '=',
        hcHideTags: '=',
        hcSource: '&',
        hcRender: '&',
        onAdd: '&',
        onRemove: '&',
        onChange: '&',
      },
      controller: function($scope, $attrs) {
        var name = $attrs.name || $attrs.hcLabelTypeahead;
        var data = [];
        var rendered = [];
        var hasRender = 'hcRender' in $attrs;
        var iteration = 0;
        $scope.hcRender = hasRender ? $scope.hcRender : noRender;

        $scope.hcAllowNew = 'hcAllowNew' in $attrs;
        $scope.dirty = false;

        if (name)
          $scope.$parent[name] = this;

        $scope.add = add;
        $scope.remove = remove;
        $scope.getSource = getSource;
        $scope.onKeydown = onKeydown;
        this.setDirty = setDirty;

        $scope.$watch('dirty && !disabled && !input.length && !ngModel.length', function(value) {
          $scope.invalid = this.invalid = value;
        }.bind(this));

        function setDirty(value) {
          $scope.dirty = !!value;
          $scope.input = '';
        }

        function render(value) {
          return $scope.hcRender({ $entry: value });
        }

        function add(input) {
          $scope.ngModel = $scope.ngModel || [];
          $scope.input = '';

          if (hasRender) {
            if ($scope.ngModel.map(render).indexOf(input) !== -1)
              return;

            input = data[rendered.indexOf(input)];
          }

          if ($scope.ngModel.indexOf(input) !== -1)
            return;

          setTypeaheadLoader(false);
          $scope.ngModel.push(input);
          $scope.onAdd({ $value: input });
          $scope.onChange({ $value: $scope.ngModel });
        }

        function remove(entry, index) {
          $scope.ngModel.splice(index, 1);
          $scope.onRemove({ $value: entry, $index: index });
          $scope.onChange({ $value: $scope.ngModel });
        }

        function getSource(input) {
          var current = ++iteration;
          return $q.when($scope.hcSource({ $viewValue: input })).then(function(result) {
            if (iteration !== current) return;
            data = result;
            rendered = hasRender ? result.map(render) : result;
            return rendered;
          });
        }

        function onKeydown(event, input) {
          $scope.dirty = true;
          if (!$scope.hcAllowNew || !input || event.keyCode !== 13)
            return;

          $scope.add(input);
          event.preventDefault();
        }

        function setTypeaheadLoader(value) {
          var keys = Object.keys($scope).filter(function(key) {
            return /^_autoloader\d+$/.test(key);
          });

          if (keys.length)
            $scope[keys[0]] = value;
        }
      }
    };
  });
});
