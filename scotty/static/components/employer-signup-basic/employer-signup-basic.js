define(function(require) {
  'use strict';
  require('session');
  require('tools/file-upload/amazon');
  require('tools/file-upload/data-url-directive');
  require('tools/file-upload/file-select-directive');
  var _ = require('underscore');
  var module = require('app-module');

  module.controller('SignupBasicCtrl', function($scope, $q, toaster, ConfigAPI, Session, Amazon) {
    this.searchLocations = ConfigAPI.locationsText;
    this.setLocation = setLocation;
    this.selectFile = selectFile;
    this.removeOffice = removeOffice;
    this.editOffice = editOffice;
    this.submitOffice = submitOffice;
    this.submit = submit;
    $scope.loading = true;
    $scope.loadingOffice = false;
    $scope.model = {};
    $scope.office = {};
    $scope.offices = [];

    listOffices();

    Session.getUserData().then(function(data) {
      if (!data) return;

      $scope.model = _.pick(data, [
        'logo_url',
        'website',
        'address_line1',
        'address_line2',
        'address_line3',
        'address_zipcode',
        'address_city',
        'contact_name',
        'contact_phone',
        'contact_position',
        'fb_url',
        'linkedin_url',
      ]);
      $scope.model.contact_email = data.contact_email || data.email;

      if (data.address_city)
        $scope.locationText = ConfigAPI.locationToText(data.address_city);
    }).finally(function() {
      $scope.loading = false;
    });

    function setLocation(model, location) {
      var city = ConfigAPI.getLocationFromText(location);
      model.errorInvalidCity = city === null;
      model.address_city = city;
    }

    function selectFile(files) {
      $scope.errorFileRequired = !files.length;
      if (files.length)
        $scope.errorFileImage = files[0].type.indexOf('image/') !== 0;
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
      Object.keys($scope.office).forEach(function(key) {
        if (!$scope.office[key])
          delete $scope.office[key];
      });

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
      if (!$scope.files || !$scope.files.length) {
        $scope.errorFileRequired = true;
        return;
      }
      if ($scope.errorFileImage)
        return;

      $scope.loading = true;

      //$q.when($scope.formSignupBasicOffice.$valid && submitOffice())
      $q.when(true).then(function() {
        return Amazon.upload($scope.files[0], 'logo', Session.id());
      }).then(function(url) {
        Object.keys($scope.model).forEach(function(key) {
          if (!$scope.model[key])
            delete $scope.model[key];
        });

        $scope.model.logo_url = url;
        return Session.updateData($scope.model);
      }).then(function() {
        $scope.signup.nextStep();
      }).catch(function() {
        toaster.defaultError();
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


