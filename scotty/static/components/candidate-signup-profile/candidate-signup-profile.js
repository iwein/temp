define(function(require) {
  'use strict';
  require('session');
  require('./amazon');
  require('./file-select-directive');
  var module = require('app-module');

  module.controller('CandidateSignupProfileCtrl', function($scope, Session, Amazon) {
    this.submit = submit;
    $scope.loading = false;

    $scope.select = function(files) {
      $scope.errorFileRequired = false;
      $scope.errorFileImage = files[0].type.indexOf('image/') !== 0;
      $scope.fileUri = '';

      if ($scope.errorFileImage)
        return;

      var reader = new FileReader();
      reader.onload = function(event) {
        $scope.$apply(function() {
          $scope.fileUri = event.target.result;
        });
      };
      reader.readAsDataURL(files[0]);
    };

    function submit() {
      if (!$scope.files) {
        $scope.errorFileRequired = true;
        return;
      }

      if ($scope.errorFileImage)
        return;

      $scope.loading = true;
      Amazon.upload($scope.files[0], '/users', Session.id()).then(function(file) {
        $scope.model.photo = file;
        return Session.setProfile($scope.model);
      }).then(function() {
        return $scope.signup.nextStep();
      }).finally(function() {
        $scope.loading = false;
      });
    }
  });

  return {
    url: '/profile',
    template: require('text!./candidate-signup-profile.html'),
    controller: 'CandidateSignupProfileCtrl',
    controllerAs: 'signupProfile',
  };
});
