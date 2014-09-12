define(function(require) {
  'use strict';
  require('tools/config-api');
  require('session');
  require('./amazon');
  require('./file-select-directive');
  var module = require('app-module');

  module.controller('CandidateSignupProfileCtrl', function($scope, $q, ConfigAPI, Session, Amazon) {
    this.searchLocations = ConfigAPI.locationsText;
    this.setLocation = setLocation;
    this.selectFile = selectFile;
    this.submit = submit;
    $scope.loading = false;

    function setLocation(location) {
      var city = ConfigAPI.getLocationFromText(location);
      $scope.errorInvalidCity = city === null;
      $scope.model.location = city;
    }

    function selectFile(files) {
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
    }

    function submit() {
      if (!$scope.files) {
        $scope.errorFileRequired = true;
        return;
      }

      if ($scope.errorFileImage)
        return;

      $scope.loading = true;
      Amazon.upload($scope.files[0], 'users', Session.id()).then(function(file) {
        return Session.updateData($scope.model).then(function() {
          return Session.setPhoto(file);
        });
      }).then(function() {
        return $scope.signup.nextStep();
      }).finally(function() {
        $scope.loading = false;
      });
    }
  });

  return {
    url: '/profile/',
    template: require('text!./candidate-signup-profile.html'),
    controller: 'CandidateSignupProfileCtrl',
    controllerAs: 'signupProfile',
  };
});
