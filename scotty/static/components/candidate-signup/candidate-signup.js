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
      onEmailChange: onEmailChange,
      submit: submit,
      loading: false,
      model: {
        invite_code: $stateParams.inviteCode,
      },
      errorEmailAlreadyRegistered: false,
    });

    return onLoad();

    function onLoad() {
      // HACK: we have to do this in order to have a live translation & register the token
      // It's critical that `message` and `.gettext` argument have EXACTLY the same content.
      var message = '<h2>Sign up as IT professional and get hired!</h2>' +
          'If you are an employer, click <a href="/employer/signup"><b>here</b></a>!';
      i18n.gettext('<h2>Sign up as IT professional and get hired!</h2>' +
          'If you are an employer, click <a href="/employer/signup"><b>here</b></a>!');

      toaster.show('alert banner-message', '<translate>' + message + '</translate>', {
        html: true,
        untilStateChange: true
      });
    }


    function onEmailChange() {
      $scope.errorEmailAlreadyRegistered = false;
    }

    function submit() {
      if (!$scope.formSignupUser.$valid)return;
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
            toaster.error(i18n.gettext('Unknown invite code'));
          else if(request.data.errors.email)
              $scope.formSignupUser.email.$setValidity('email', false);
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
