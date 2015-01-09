define(function(require) {
  'use strict';
  var module = require('app-module');


  module.controller('ResetPasswordCtrl', function($scope, $state, toaster, Session) {
    this.check = check;
    this.submit = submit;
    $scope.ready = false;
    $scope.loading = false;
    var token = $state.params.token;

    function invalid() {
      toaster.error('Invalid reset token');
      window.location = '../login.html';
    }

    Session.valdiateResetToken(token).then(function(isValid) {
      if (isValid)
        $scope.ready = true;
      else
        invalid();
    }).catch(invalid);

    function check(password, confirm) {
      $scope.errorNotEqual = password !== confirm;
    }

    function submit(password) {
      if ($scope.errorNotEqual) {
        $scope.formResetPassword.password.$dirty = true;
        $scope.formResetPassword.confirm.$dirty = true;
        return;
      }

      $scope.loading = true;
      Session.resetPassword(token, password)
        .then(function() {
          toaster.success('Your password has been updated. You can now login with your new password');
          window.location = '../login.html';
        })
        .catch(toaster.defaultError)
        .finally(function() {
          $scope.loading = false;
        });
    }
  });


  return {
    url: '/reset-password/:token',
    template: require('text!./shared-reset-password.html'),
    controller: 'ResetPasswordCtrl',
    controllerAs: 'resetPassword',
  };
});
