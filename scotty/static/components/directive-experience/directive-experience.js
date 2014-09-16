define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.directive('hcExperience', function() {
    return {
      restrict: 'A',
      scope: {
        hcTitle: '@',
        hcEdit: '&',
        hcRemove: '&',
      },
      template: require('text!./directive-experience.html'),
      controller: function($scope, $attrs, Session) {
        if ('hcEditable' in $attrs) $scope.hcEditable = true;
        if ('hcShowEmpty' in $attrs) $scope.hcShowEmpty = true;

        if ($attrs.hcExperience)
          $scope.$parent[$attrs.hcExperience] = this;

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
          return Session.deleteExperience(entry).then(function() {
            list();
            $scope.hcRemove(entry.id);
          });
        }

        function list() {
          $scope.error = false;
          return Session.getExperience().then(function(data) {
            $scope.model = data;
          }).catch(function() {
            $scope.error = true;
          });
        }
      },
    };
  });
});
