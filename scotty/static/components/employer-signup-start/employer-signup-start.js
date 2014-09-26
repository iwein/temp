define(function(require) {
  'use strict';
  require('session');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.controller('SignupStartCtrl', function($scope, $q, $state, toaster, ConfigAPI, Session) {
    this.onEmailChange = onEmailChange;
    this.submit = submit;
    $scope.invited = false;
    $scope.loading = true;
    $scope.model = {};
    $scope.errorAlreadyRegistered = false;
    var token = $state.params.token;

    ConfigAPI.companyTypes().then(fn.setTo('companyTypes', $scope));
    ConfigAPI.salutations().then(fn.setTo('salutations', $scope));

    $q.when(token).then(function(token) {
      if (!token) return;
      return Session.getInvitationData(token);
    }).then(function(data) {
      if (!data) return;
      $scope.invited = true;
      $scope.model = {
        company_name: data.company_name,
        company_type: data.company_type,
        contact_first_name: data.contact_first_name,
        contact_last_name: data.contact_last_name,
        contact_salutation: data.contact_salutation,
        email: data.email,
      };
    }, function() {
      toaster.error('Invalid invitation token.');
    }).finally(function() {
      $scope.loading = false;
    });

    function onEmailChange() {
      $scope.errorAlreadyRegistered = false;
    }

    function submit() {
      if ($scope.formSignupStart.password.$invalid)
        return;

      $scope.loading = true;
      (token ?
        Session.signupInvited(token, $scope.model.pwd) :
        Session.signup($scope.model)
      ).then(function() {
        $scope.signup.nextStep();
      }).catch(function(request) {
        if (request.status === 409)
          $scope.errorAlreadyRegistered = true;
        else
          toaster.defaultError();
      }).finally(function() {
        $scope.loading = false;
      });
    }
  });

  return {
    url: '/start/:token',
    template: require('text!./employer-signup-start.html'),
    controller: 'SignupStartCtrl',
    controllerAs: 'signupStart',
  };
});


