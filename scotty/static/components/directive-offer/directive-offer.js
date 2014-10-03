define(function(require) {
  'use strict';
  var angular = require('angular');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.directive('hcOffer', function() {
    return {
      restrict: 'EA',
      transclude: true,
      template: require('text!./directive-offer.html'),
      scope: {
        model: '=ngModel',
        hcTitle: '@',
        hcHide: '@',
        onStatusChange: '&',
        hcWithdrawButton: '=',
        hcRejectButton: '=',
        hcAcceptButton: '=',
        hcNextStatusButton: '=',
        hcSignedButton: '=',
        hcProfileLinks: '=',
        hcLink: '=',
        hcDisabled: '=',
      },
      link: function(scope) {
        try {
          scope.hide = angular.fromJson(scope.hcHide || '{}');
        } catch (err) {
          throw new Error('Invalid JSON at hc-hide attribute. ' +
            'Remember to use angular\'s expression {{ { key: "value" } }}');
        }
      },
      controller: function($scope, ConfigAPI) {
        $scope.toggleWithdrawing = toggleWithdrawing;
        $scope.toggleRejecting = toggleRejecting;
        $scope.toggleSigning = toggleSigning;
        $scope.withdrawal = {};
        $scope.rejection = {};
        $scope.signedData = {};

        ConfigAPI.withdrawReasons().then(fn.setTo('withdrawReasons', $scope));
        ConfigAPI.rejectReasons().then(fn.setTo('rejectReasons', $scope));

        function toggleWithdrawing() {
          $scope.withdrawing = !$scope.withdrawing;
        }

        function toggleRejecting() {
          $scope.rejecting = !$scope.rejecting;
        }

        function toggleSigning() {
          $scope.signing = !$scope.signing;
        }
      },
    };
  });
});