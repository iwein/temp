define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('SignupBasicCtrl', function($scope, $q, $state, ConfigAPI, Session) {
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

    listOffices();

    function setLocation(model, location) {
      var city = ConfigAPI.getLocationFromText(location);
      model.errorInvalidCity = city === null;
      model.address_city = city;
    }

    function listOffices() {
      return Session.listOffices().then(function(offices) {
        $scope.offices = offices;
      });
    }

    function removeOffice(office) {
      $scope.loadingOffice = true;
      return Session.removeOffice(office)
        .then(listOffices)
        .finally(function() {
          $scope.loadingOffice = false;
        });
    }

    function editOffice(office) {
      removeOffice(office).then(function() {
        $scope.office = office;
        $scope.officeLocationText = ConfigAPI.locationToText(office.address_city);
      });
    }

    function submitOffice() {
      $scope.loadingOffice = true;
      return Session.addOffice($scope.office)
        .then(listOffices)
        .then(function() {
          $scope.office = {};
          $scope.officeLocationText = '';
        })
        .finally(function() {
          $scope.loadingOffice = false;
        });
    }

    function submit() {
      $scope.loading = true;
      $scope.error = false;

      $q.when($scope.formSignupBasicOffice.$valid && submitOffice()).then(function() {
        return Session.updateData($scope.model);
      }).then(function() {
        $scope.signup.nextStep();
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


