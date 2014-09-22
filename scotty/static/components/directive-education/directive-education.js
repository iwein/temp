define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.directive('hcEducation', function() {
    return {
      restrict: 'EA',
      scope: {
        hcTitle: '@',
        onEdit: '&',
        onRemove: '&',
        hcSource: '&',
        hcSourceRemove: '&',
      },
      template: require('text!./directive-education.html'),
      controller: function($scope, $attrs) {
        var self = this;

        if ('hcEditable' in $attrs) $scope.hcEditable = true;
        if ('hcShowEmpty' in $attrs) $scope.hcShowEmpty = true;

        var name = $attrs.name || $attrs.hcEducation;
        if (name)
          $scope.$parent[name] = this;

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
            self.length = data.length;
          }).catch(function() {
            $scope.error = true;
          });
        }
      },
    };
  });
});
