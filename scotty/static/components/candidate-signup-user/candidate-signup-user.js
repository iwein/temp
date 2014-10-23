define(function(require) {
  'use strict';
  var _ = require('underscore');
  var module = require('app-module');

  module.controller('CandidateSignupUserCtrl', function($scope, $q, $state, toaster, Loader, Session) {
    this.onEmailChange = onEmailChange;
    this.submit = submit;
    $scope.importLinkedin = importLinkedin;
    $scope.loading = false;
    $scope.model = {};
    $scope.errorAlreadyRegistered = false;
    var linkedin = Session.getLinkedIn();
    Loader.page(true);

    linkedin.checkConnection().then(function(isConnected) {
      if (isConnected)
        return importLinkedin();
    }).finally(function() {
      Loader.page(false);
    });

    function importLinkedin() {
      Loader.add('signup-user-import');
      return linkedin.getData().then(function(data) {
        var name = data.name.split(' ');
        $scope.model.first_name = name.shift();
        $scope.model.last_name = name.join(' ');
        $scope.model.email = data.email;
        $scope.imported = true;
      }).finally(function() {
        Loader.remove('signup-user-import');
      });
    }

    function onEmailChange() {
      $scope.errorAlreadyRegistered = false;
    }

    function submit() {
      $scope.loading = true;
      Loader.add('signup-user-saving');

      return Session.signup($scope.model).then(function() {
        var position = _.omit($scope.signup.target, 'preferred_locations', 'featuredSkills');
        var locations = $scope.signup.preferred_locations;
        position.skills = [].concat(position.skills || [], $scope.signup.target.featuredSkills || []);

        return $q.all([
          Session.user.setTargetPosition(position),
          Session.user.setPreferredLocations(locations),
        ]);
      }).then(function() {
        localStorage.removeItem('scotty:target_position');
        return $scope.signup.nextStep();
      }).catch(function(request) {
        if (request.status === 409) {
          $scope.errorAlreadyRegistered = true;
          return;
        }

        if (request.status === 400 && request.data.db_message === 'Unknown InviteCode') {
          toaster.error('Unknown invite code');
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
