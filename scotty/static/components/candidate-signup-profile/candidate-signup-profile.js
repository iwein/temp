define(function(require) {
  'use strict';
  require('tools/config-api');
  require('tools/file-upload/amazon');
  require('tools/file-upload/data-url-directive');
  require('tools/file-upload/file-select-directive');
  require('session');
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
      $scope.model.contact_city = city;
    }

    function selectFile(files) {
      $scope.errorFileRequired = !files.length;
      if (files.length)
        $scope.errorFileImage = files[0].type.indexOf('image/') !== 0;
    }

    function submit() {
      if (!$scope.files || !$scope.files.length) {
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
