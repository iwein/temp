define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('SignupTermsCtrl', function($scope, Session) {
    this.submit = submit;
    $scope.loading = false;
    $scope.model = {};

    function submit() {
      $scope.loading = true;
      $scope.error = false;

      Session.apply($scope.model).then(function() {
        $scope.signup.nextStep();
      }).catch(function() {
        $scope.error = true;
      }).finally(function() {
        $scope.loading = false;
      });
    }
  });

  return {
    url: '/terms/',
    template: require('text!./employer-signup-terms.html'),
    controller: 'SignupTermsCtrl',
    controllerAs: 'signupTerms',
  };
});
