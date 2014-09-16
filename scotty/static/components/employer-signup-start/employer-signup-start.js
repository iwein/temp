define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('SignupStartCtrl', function($scope, $q, $state, toaster, Session) {
    this.submit = submit;
    $scope.invited = false;
    $scope.loading = true;
    $scope.model = {};
    var token = $state.params.token;

    $q.when(token).then(function(token) {
      if (!token) return;
      return Session.getInvitationData(token);
    }).then(function(data) {
      if (!data) return;
      $scope.invited = true;
      $scope.model = {
        contact_name: data.contact_name,
        company_name: data.company_name,
        email: data.email
      };
    }, function() {
      toaster.error('Invalid invitation token.');
    }).finally(function() {
      $scope.loading = false;
    });

    function submit() {
      $scope.loading = true;

      (token ?
        Session.signupInvited(token, $scope.model.pwd) :
        Session.signup($scope.model)
      ).then(function() {
        $scope.signup.nextStep();
      }).catch(function(request) {
        if (request.status === 409)
          toaster.error('Email address already registered.');
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


