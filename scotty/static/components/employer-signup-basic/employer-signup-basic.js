define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('SignupBasicCtrl', function($scope, $state, ConfigAPI, Session) {
    this.searchLocations = ConfigAPI.locationsText;
    this.setLocation = setLocation;
    this.removeOffice = removeOffice;
    this.editOffice = editOffice;
    this.submitOffice = submitOffice;
    this.submit = submit;
    $scope.loading = false;
    $scope.loadingOffice = false;
    $scope.model = {};
    $scope.office = {};
    $scope.offices = [];

    function setLocation(model, location) {
      var city = ConfigAPI.getLocationFromText(location);
      model.errorInvalidCity = city === null;
      model.address_city = city;
    }

    function removeOffice(index) {
      $scope.offices.splice(index, 1);
    }

    function editOffice(office, index) {
      removeOffice(index);
      $scope.office = office;
      $scope.officeLocationText = ConfigAPI.locationToText(office.address_city);
    }

    function submitOffice() {
      $scope.loadingOffice = true;
      $scope.offices.push($scope.office);
      $scope.office = {};
      $scope.officeLocationText = '';
      $scope.loadingOffice = false;
    }

    function submit() {
      $scope.loading = true;
      $scope.error = false;

      if ($scope.formSignupBasicOffice.$valid)
        submitOffice();

      Session.signup($scope.model).then(function() {
        $state.go('home');
      }).catch(function() {
        $scope.error = true;
      }).finally(function() {
        $scope.loading = false;
      });
    }
  });

  return {
    url: '/basic/',
    template: require('text!./employer-signup-basic.html'),
    controller: 'SignupBasicCtrl',
    controllerAs: 'signupBasic',
  };
});


