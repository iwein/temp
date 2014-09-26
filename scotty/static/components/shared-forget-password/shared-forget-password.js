define(function(require) {
  'use strict';
  var module = require('app-module');


  module.controller('ForgetPasswordCtrl', function($scope, toaster, Session) {
    this.onChange = onChange;
    this.submit = submit;
    $scope.loading = false;

    function onChange() {
      $scope.alreadySent = false;
    }

    function submit(email) {
      var params = { email: email };
      if ($scope.alreadySent)
        params.resend = 1;

      $scope.loading = true;
      $scope.alreadySent = false;

      Session.recoverPassword(params).then(function() {
        toaster.success('An email with password reset instruction was sent to ' + email);
        $scope.alreadySent = true;
      }).catch(function(request) {
        if (request.status === 409) {
          toaster.warning('Instructions already sent to ' + email);
          $scope.alreadySent = true;
        } else
          toaster.defaultError();
      }).finally(function() {
        $scope.loading = false;
      });
    }
  });


  return {
    url: '/forgot-password/',
    template: require('text!./shared-forget-password.html'),
    controller: 'ForgetPasswordCtrl',
    controllerAs: 'forgetPassword',
  };
});
