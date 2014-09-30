define(function(require) {
  'use strict';
  require('session');
  var booleanAttrs = require('tools/boolean-attrs');
  var nameAttr = require('tools/name-attr');
  var module = require('app-module');

  module.directive('hcOffice', function() {
    return {
      restrict: 'EA',
      scope: {
        hcTitle: '@',
        onEdit: '&',
        onRemove: '&',
        hcSource: '&',
        hcSourceRemove: '&',
      },
      template: require('text!./directive-office.html'),
      controller: function($scope, $attrs) {
        var self = this;
        booleanAttrs($scope, $attrs, [
          'hcEditable',
          'hcShowEmpty',
        ]);

        nameAttr(this, 'hcOffice', $scope, $attrs);
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
