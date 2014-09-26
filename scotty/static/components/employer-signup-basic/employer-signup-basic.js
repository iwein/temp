define(function(require) {
  'use strict';
  require('session');
  require('tools/file-upload/amazon');
  require('tools/file-upload/data-url-directive');
  require('tools/file-upload/file-select-directive');
  require('components/directive-office/directive-office');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.controller('SignupBasicCtrl', function($scope, $q, toaster, ConfigAPI, Session, Amazon) {
    this.searchLocations = searchLocations;
    this.setLocation = setLocation;
    this.selectFile = selectFile;
    this.editOffice = editOffice;
    this.submitOffice = submitOffice;
    this.submit = submit;
    $scope.loading = true;
    $scope.loadingOffice = false;
    $scope.model = {};
    $scope.office = {};
    var citiesCache = [];

    ConfigAPI.countries({ limit: 500 }).then(fn.setTo('countries', $scope));
    ConfigAPI.salutations().then(fn.setTo('salutations', $scope));

    Session.getUser().then(function(user) {
      return user && user.getData();
    }).then(function(data) {
      if (!data) return;

      $scope.model = _.pick(data, [
        'logo_url',
        'website',
        'fb_url',
        'linkedin_url',
      ]);

      $scope.office = _.pick(data, [
        'contact_first_name',
        'contact_last_name',
        'contact_salutation',
      ]);
      $scope.office.contact_email = data.email;

      if (data.address_city)
        $scope.locationText = ConfigAPI.locationToText(data.address_city);
    }).finally(function() {
      $scope.ready = true;
      $scope.loading = false;
    });

    function searchLocations(term, country) {
      return ConfigAPI.locations({
        country_iso: country,
        q: term,
      }).then(function(locations) {
        citiesCache = locations.map(fn.get('city'));
        return citiesCache;
      });
    }

    function setLocation(city) {
      $scope.errorInvalidCity = citiesCache.indexOf(city) === -1;
      if ($scope.errorInvalidCity)
        $scope.office.address_city.city = '';
    }

    function selectFile(files) {
      $scope.errorFileRequired = !files.length;
      if (files.length)
        $scope.errorFileImage = files[0].type.indexOf('image/') !== 0;
    }

    function editOffice(office) {
      $scope.office = office;
    }

    function submitOffice() {
      $scope.loadingOffice = true;
      Object.keys($scope.office).forEach(function(key) {
        if (!$scope.office[key])
          delete $scope.office[key];
      });

      return Session.getUser().then(function(user) {
        return user.addOffice($scope.office);
      }).then(function() {
        return $scope.list.refresh();
      }).then(function() {
        $scope.formSignupBasicOffice.$setPristine();
        $scope.office = {};
      }).finally(function() {
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

      Object.keys($scope.model).forEach(function(key) {
        if (!$scope.model[key])
          delete $scope.model[key];
      });

      $scope.loading = true;

      $q.when($scope.formSignupBasicOffice.$valid && submitOffice()).then(function() {
        return Amazon.upload($scope.files[0], 'logo', Session.id());
      }).then(function(url) {
        $scope.model.logo_url = url;
        return Session.getUser();
      }).then(function(user) {
        return user.updateData($scope.model);
      }).then(function() {
        return $scope.signup.nextStep();
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


