define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('SignupTermsCtrl', function($scope, toaster, Loader, Session) {
    this.submit = submit;
    $scope.loading = false;
    $scope.model = {};

    function submit() {
      if(!$scope.formSignupTerms.$valid)return;
      $scope.loading = true;
      Loader.add('signup-terms-saving');

      Session.user.apply($scope.model).then(function() {
        $scope.signup.nextStep();
      }).catch(function() {
        toaster.defaultError();
      }).finally(function() {
        $scope.loading = false;
        Loader.remove('signup-terms-saving');
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
