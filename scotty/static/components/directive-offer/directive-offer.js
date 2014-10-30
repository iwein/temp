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
        hcShowId: '=',
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
        $scope.withdraw = withdraw;
        $scope.reject = reject;
        $scope.accept = accept;
        $scope.sign = sign;
        $scope.popups = {
          toggle: toggle,
          isOpen: isOpen,
          isOpenBut: isOpenBut,
        };

        var flags = {};
        var email;

        if (Session.getUser) {
          Session.getUser().then(function(user) {
            return user.getData();
          }).then(function(data) {
            email = data.email;
          });
        }

        ConfigAPI.withdrawReasons().then(fn.setTo('withdrawReasons', $scope));
        ConfigAPI.rejectReasons().then(fn.setTo('rejectReasons', $scope));


        function toggle(key) {
          flags[key] = !flags[key];
          if (!flags[key])
            delete flags[key];

          $scope.withdrawal = {};
          $scope.rejection = {};
          $scope.acceptance = { email: email };
          $scope.signedData = {};
        }

        function isOpen(key) {
          return !!flags[key];
        }

        function isOpenBut(key) {
          var keys = Object.keys(flags);
          return !keys.length || (keys.length === 1 && keys[0] === key);
        }

        function withdraw(model, data) {
          model.withdraw(data).then(toggle.bind(null, 'withdraw'));
        }

        function reject(model, data) {
          model.reject(data).then(toggle.bind(null, 'reject'));
        }

        function accept(model, data) {
          model.accept(data).then(toggle.bind(null, 'accept'));
        }

        function sign(model, data) {
          model.sign(data).then(toggle.bind(null, 'sign'));
        }
      },
    };
  });
});
