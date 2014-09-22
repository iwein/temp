define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.directive('hcTargetPositions', function() {
    return {
      restrict: 'EA',
      scope: {
        hcTitle: '@',
        onEdit: '&',
        onRemove: '&',
        hcSource: '&',
        hcSourceRemove: '&',
      },
      template: require('text!./directive-target-positions.html'),
      controller: function($scope, $attrs) {
        if ('hcEditable' in $attrs) $scope.hcEditable = true;
        if ('hcShowEmpty' in $attrs) $scope.hcShowEmpty = true;

        var name = $attrs.name || $attrs.hcTargetPositions;
        if (name) {
          if ('ngIf' in $attrs)
            $scope.$parent.$parent[name] = this;
          else
            $scope.$parent[name] = this;
        }

        list();
        $scope.edit = edit;
        $scope.remove = remove;
        this.refresh = list;

        function edit(entry) {
          remove(entry).then(function() {
            $scope.onEdit({ $entry: entry });
          });
        }

        function remove(entry) {
          return $scope.hcSourceRemove({ $entry: entry }).then(function() {
            list();
            $scope.onRemove(entry.id);
          });
        }

        function list() {
          $scope.error = false;
          return $scope.hcSource().then(function(data) {
            $scope.model = data;
          }).catch(function() {
            $scope.error = true;
          });
        }
      },
    };
  });
});
