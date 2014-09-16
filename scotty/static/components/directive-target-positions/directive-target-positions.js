define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.directive('hcTargetPositions', function() {
    return {
      restrict: 'EA',
      scope: {
        hcTitle: '@',
        hcEdit: '&',
        hcRemove: '&',
      },
      template: require('text!./directive-target-positions.html'),
      controller: function($scope, $attrs, Session) {
        if ('hcEditable' in $attrs) $scope.hcEditable = true;
        if ('hcShowEmpty' in $attrs) $scope.hcShowEmpty = true;

        if ($attrs.hcTargetPositions)
          $scope.$parent[$attrs.hcTargetPositions] = this;

        list();
        $scope.edit = edit;
        $scope.remove = remove;
        this.refresh = list;

        function edit(entry) {
          remove(entry).then(function() {
            $scope.hcEdit({ $entry: entry });
          });
        }

        function remove(entry) {
          return Session.deleteTargetPosition(entry).then(function() {
            list();
            $scope.hcRemove(entry.id);
          });
        }

        function list() {
          $scope.error = false;
          return Session.getTargetPositions().then(function(data) {
            $scope.model = data;
          }).catch(function() {
            $scope.error = true;
          });
        }
      },
    };
  });
});
