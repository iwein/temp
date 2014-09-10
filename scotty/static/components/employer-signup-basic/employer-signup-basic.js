define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('SignupBasicCtrl', function($scope, $state, Session) {
    this.submit = submit;
    $scope.loading = false;
    $scope.model = {};

    if ($scope.signup.invited) {
      $scope.model = {
        contact_name: $scope.signup.invitedData.contact_name,
        company_name: $scope.signup.invitedData.company_name,
        email: $scope.signup.invitedData.email,
      };
    }

    function submit() {
      $scope.loading = true;
      $scope.error = false;

      Session.signup($scope.model).then(function() {
        $state.go('home');
      }).catch(function() {
        $scope.error = true;
      }).finally(function() {
        $scope.loading = false;
      });
    }
  });

  return {
    url: '/basic',
    template: require('text!./employer-signup-basic.html'),
    controller: 'SignupBasicCtrl',
    controllerAs: 'signupBasic',
  };
});


