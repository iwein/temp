// jshint camelcase:false

define(function(require) {
  'use strict';
  var module = require('app-module');

  module.controller('CandidateSignupUserCtrl', function($scope, $q, $state, toaster, Session) {
    this.onEmailChange = onEmailChange;
    this.submit = submit;
    $scope.importLinkedin = importLinkedin;
    $scope.loading = false;
    $scope.model = {};
    $scope.errorAlreadyRegistered = false;
    var linkedin = Session.getLinkedIn();

    if ($state.params.import)
      importLinkedin();

    function importLinkedin() {
      linkedin.getData().then(function(data) {
        var name = data.name.split(' ');
        $scope.model.first_name = name.shift();
        $scope.model.last_name = name.join(' ');
        $scope.model.email = data.email;
      });
    }

    function onEmailChange() {
      $scope.errorAlreadyRegistered = false;
    }

    function submit() {
      $scope.loading = true;

      Session.signup($scope.model).then(function() {
        var position = $scope.signup.target;
        var locations = $scope.signup.preferred_locations;

        return $q.all([
          Session.user.addTargetPosition(position),
          Session.user.setPreferredLocations(locations),
        ]);
      }).then(function() {
        localStorage.removeItem('scotty:target_position');
        return $scope.signup.nextStep();
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
    url: '/user/:import',
    template: require('text!./candidate-signup-user.html'),
    controller: 'CandidateSignupUserCtrl',
    controllerAs: 'signupUser',
  };
});
