define(function(require) {
  'use strict';
  require('tools/config-api');
  require('tools/file-upload/amazon');
  require('tools/file-upload/data-url-directive');
  require('tools/file-upload/file-select-directive');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.controller('CandidateSignupProfileCtrl', function($scope, $q, ConfigAPI, Session, Amazon) {
    this.searchLocations = ConfigAPI.locationsText;
    this.setLocation = setLocation;
    this.selectFile = selectFile;
    this.submit = submit;
    $scope.loading = false;

    ConfigAPI.countries({ limit: 500 }).then(fn.setTo('countries', $scope));

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
        return Session.user.updateData($scope.model).then(function() {
          return Session.user.setPhoto(file);
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
