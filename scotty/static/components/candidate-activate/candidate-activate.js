define(function(require) {
  'use strict';
  var module = require('app-module');

  module.controller('CandidateActivateCtrl', function($scope, $state, gettext, toaster, Loader, Session) {
    Loader.page(true);

    Session.activate($state.params.token).then(function() {
      return Session.getUser();
    }).then(function() {
      $scope.success = true;
      $scope.signupComplete = Session.isSignupComplete;
    }, function(request) {
      if (request.status === 404) {
        toaster.error(gettext('Invalid invitation token.'));
        $scope.failed = true;
        $state.go('dashboard');
      } else
        toaster.defaultError();
    }).finally(function() {
      Loader.page(false);
    });
  });


  return {
    url: '/activate/:token',
    template: require('text!./candidate-activate.html'),
    controller: 'CandidateActivateCtrl',
    controllerAs: 'activate'
  };
});
