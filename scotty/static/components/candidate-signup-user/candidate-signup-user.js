define(function(require) {
  'use strict';
  require('components/element-connectors-buttons/element-connectors-buttons');
  var module = require('app-module');

  module.directive('hcTosLink', function() {
    return {
      restrict: 'E',
      transclude: true,
      template: '<a class="link" style="text-decoration: underline;" ' +
        'href="/en/terms-candidate.html" target="_blank" ng-transclude></a>',
    };
  });

  module.controller('CandidateSignupUserCtrl', function($scope, $q, $state, toaster, i18n, Loader, ConfigAPI, Session) {
    this.onEmailChange = onEmailChange;
    this.submit = submit;
    $scope.loading = false;
    $scope.model = {};
    $scope.errorEmailAlreadyRegistered = false;


    function onEmailChange() {
      $scope.errorEmailAlreadyRegistered = false;
    }

    function submit() {
      if (!$scope.formSignupUser.$valid)return;
      var id = localStorage.getItem('scotty:user_id');
      $scope.loading = true;
      $scope.model.locale = i18n.getCurrent();
      Loader.add('signup-user-saving');

      return Session.createUser(id, $scope.model).then(function() {
        localStorage.removeItem('scotty:user_id');
      }).then(function() {
        return $scope.signup.nextStep();
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
    url: '/user/',
    template: require('text!./candidate-signup-user.html'),
    controller: 'CandidateSignupUserCtrl',
    controllerAs: 'signupUser',
  };
});
