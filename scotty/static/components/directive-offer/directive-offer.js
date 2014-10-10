define(function(require) {
  'use strict';
  var angular = require('angular');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.directive('hcOffer', function() {
    return {
      restrict: 'EA',
      template: require('text!./directive-offer.html'),
      scope: {
        model: '=ngModel',
        hcTitle: '@',
        hcHide: '@',
        onStatusChange: '&',
        hcRollbackButton: '=',
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
        $scope.reject = reject;
        $scope.withdraw = withdraw;
        $scope.sign = sign;
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

        function reject(model, data) {
          model.reject(data).then(function() {
            $scope.rejecting = false;
          });
        }

        function withdraw(model, data) {
          model.withdraw(data).then(function() {
            $scope.withdrawing = false;
          });
        }

        function sign(model, data) {
          model.sign(data).then(function() {
            $scope.signing = false;
          });
        }
      },
    };
  });
});
