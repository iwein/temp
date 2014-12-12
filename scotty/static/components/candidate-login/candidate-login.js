define(function(require) {
  'use strict';
  var module = require('app-module');

  module.controller('CandidateLoginCtrl', function($scope, $location, $state, toaster, Loader, Session) {
    this.submit = submit;
    $scope.error = false;
    $scope.loading = false;
    var redirect = $state.params.go;

    function submit(email, password) {
      $scope.error = false;
      $scope.loading = true;
      Loader.add('candidate-login');

      Session.login(email, password).then(function() {
        if (redirect) {
          $location.search('go', null);
          $location.path(redirect);
        } else {
          $state.go(Session.isActivated ? 'dashboard' : 'signup');
        }
      }, function(error) {
        toaster.error('Invalid email or password.');
        throw error;
      }).finally(function() {
        $scope.loading = false;
        Loader.remove('candidate-login');
      });
    }
  });


  return {
    url: '/login/?go',
    template: require('text!./candidate-login.html'),
    controller: 'CandidateLoginCtrl',
    controllerAs: 'login'
  };
});
