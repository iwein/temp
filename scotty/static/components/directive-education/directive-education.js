define(function(require) {
  'use strict';
  require('session');
  var nameAttr = require('tools/name-attr');
  var module = require('app-module');

  module.directive('hcEducation', function() {
    return {
      restrict: 'EA',
      transclude: true,
      scope: {
        hcTitle: '@',
        onLoad: '&',
        onEdit: '&',
        onRemove: '&',
        hcSource: '&',
        hcSourceRemove: '&',
        hcEditable: '=',
        hcShowEmpty: '=',
        hcRemoveLast: '=',
      },
      template: require('text!./directive-education.html'),
      controller: function($scope, $attrs) {
        var self = this;
        $scope.edit = edit;
        $scope.remove = remove;
        this.refresh = list;

        nameAttr(this, 'hcEducation', $scope, $attrs);
        list().then(function() {
          $scope.onLoad();
        });

        function edit(entry) {
          return $scope.onEdit({ $entry: entry });
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
