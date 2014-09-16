define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.directive('hcEducation', function() {
    return {
      restrict: 'A',
      scope: {
        hcTitle: '@',
        hcEdit: '&',
        hcRemove: '&',
      },
      template: require('text!./directive-education.html'),
      controller: function($scope, $attrs, Session) {
        if ('hcEditable' in $attrs) $scope.hcEditable = true;
        if ('hcShowEmpty' in $attrs) $scope.hcShowEmpty = true;

        if ($attrs.hcEducation)
          $scope.$parent[$attrs.hcEducation] = this;

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
          return Session.deleteEducation(entry).then(function() {
            list();
            $scope.hcRemove(entry.id);
          });
        }

        function list() {
          $scope.error = false;
          return Session.getEducation().then(function(data) {
            $scope.model = data;
          }).catch(function() {
            $scope.error = true;
          });
        }
      },
    };
  });
});
