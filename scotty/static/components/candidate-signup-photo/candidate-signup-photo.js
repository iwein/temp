define(function(require) {
  'use strict';
  require('session');
  require('./amazon');
  require('./file-select-directive');
  var module = require('app-module');

  module.controller('CandidateSignupPhotoCtrl', function($scope, Session, Amazon) {
    this.submit = submit;
    $scope.loading = false;

    $scope.select = function() {
      $scope.errorFileRequired = false;
    };

    function submit() {
      if (!$scope.files) {
        $scope.errorFileRequired = true;
        return;
      }

      $scope.loading = true;
      Amazon.upload($scope.files[0], '/users').then(function(file) {
        return CandidateSession.setPicture(file);
      }).then(function() {
        return $scope.signup.nextStep();
      }).finally(function() {
        $scope.loading = false;
      });
    }
  });

  return {
    url: '/photo',
    template: require('text!./candidate-signup-photo.html'),
    controller: 'CandidateSignupPhotoCtrl',
    controllerAs: 'signupPhoto',
  };
});
