define(function(require) {
  'use strict';
  var module = require('app-module');

  module.directive('hcConnectorsButtons', function() {
    return {
      restrict: 'EA',
      template: require('text!./element-connectors-buttons.html'),
      scope: {},
      controller: function($scope, Session) {
        var connectors = Session.getConnectors().getAsMap();
        $scope.linkedin = connectors.linkedin;
        $scope.xing = connectors.xing;
        $scope.linkedin.checkConnection();
        $scope.xing.checkConnection();
      }
    };
  });
});
