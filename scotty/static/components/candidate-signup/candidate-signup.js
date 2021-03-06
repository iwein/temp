define(function(require) {
  'use strict';
  var _ = require('underscore');
  var module = require('app-module');


  module.directive('hcTosLink', function() {
    return {
      restrict: 'E',
      transclude: true,
      template: '<a class="link" style="text-decoration: underline;" ' +
        'href="{{ staticUrl() }}/terms-candidate.html" target="_blank" ng-transclude></a>',
    };
  });


  // jshint maxparams:9
  module.controller('CandidateSignupCtrl', function($scope, $q, $state, $stateParams,
    toaster, i18n, Loader, ConfigAPI, Session) {

    _.extend($scope, {
      onInviteCodeChange: onInviteCodeChange,
      onEmailChange: onEmailChange,
      submit: submit,
      loading: false,
      model: {
        invite_code: $stateParams.inviteCode,
      },
      errorEmailAlreadyRegistered: false,
    });


    function onEmailChange() {
      $scope.errorEmailAlreadyRegistered = false;
    }

    function onInviteCodeChange() {
      $scope.errorInvalidInviteCode = false;
    }

    function submit() {
      if (!$scope.form.$valid)return;
      $scope.loading = true;
      $scope.model.locale = i18n.getCurrent();
      Loader.add('signup-user-saving');

      return Session.signup($scope.model).then(function() {
        return $state.go('signup-complete');
      }).catch(function(request) {
        if (request.status === 409) {
          $scope.errorEmailAlreadyRegistered = true;
          return;
        }

        if (request.status === 400 && request.data.errors) {
          if(request.data.errors.invite_code === 'INVALID CHOICE')
            $scope.errorInvalidInviteCode = true;
          else if(request.data.errors.email)
            $scope.form.email.$setValidity('email', false);
          return;
        }

        throw request;
      }).catch(function() {
        toaster.defaultError();
      }).finally(function() {
        $scope.loading = false;
        Loader.remove('signup-user-saving');
      });
    }
  });


  return {
    url: '/signup/{inviteCode}',
    template: require('text!./candidate-signup.html'),
    controller: 'CandidateSignupCtrl',
  };
});
