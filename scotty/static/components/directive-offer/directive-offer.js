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
      controller: function($scope, ConfigAPI, Session) {
        $scope.toggleWithdrawing = toggleWithdrawing;
        $scope.toggleRejecting = toggleRejecting;
        $scope.toggleAccepting = toggleAccepting;
        $scope.toggleSigning = toggleSigning;
        $scope.withdraw = withdraw;
        $scope.reject = reject;
        $scope.accept = accept;
        $scope.sign = sign;

        var email;
        Session.getUser().then(function(user) {
          return user.getData();
        }).then(function(data) {
          email = data.email;
        });

        ConfigAPI.withdrawReasons().then(fn.setTo('withdrawReasons', $scope));
        ConfigAPI.rejectReasons().then(fn.setTo('rejectReasons', $scope));

        //accepting" ng-submit="accept

        function toggleWithdrawing() {
          $scope.withdrawing = !$scope.withdrawing;
          $scope.withdrawal = {};
        }

        function toggleRejecting() {
          $scope.rejecting = !$scope.rejecting;
          $scope.rejection = {};
        }

        function toggleAccepting() {
          $scope.accepting = !$scope.accepting;
          $scope.acceptance = { email: email };
        }

        function toggleSigning() {
          $scope.signing = !$scope.signing;
          $scope.signedData = {};
        }

        function withdraw(model, data) {
          model.withdraw(data).then(toggleWithdrawing);
        }

        function reject(model, data) {
          model.reject(data).then(toggleRejecting);
        }

        function accept(model, data) {
          model.accept(data).then(toggleAccepting);
        }

        function sign(model, data) {
          model.sign(data).then(toggleSigning);
        }
      },
    };
  });
});
