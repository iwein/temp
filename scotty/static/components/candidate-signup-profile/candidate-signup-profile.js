define(function(require) {
  'use strict';
  require('tools/config-api');
  require('tools/file-upload/amazon');
  require('tools/file-upload/data-url-directive');
  require('tools/file-upload/file-select-directive');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var months = require('tools/months');
  var module = require('app-module');

  module.controller('CandidateSignupProfileCtrl', function($scope, $q, $state, Amazon, Loader, ConfigAPI, Session) {
    _.extend($scope, {
      searchLocations: ConfigAPI.locationsText,
      setLocation: setLocation,
      selectFile: selectFile,
      updateDob: updateDob,
      months: months,
      submit: submit,
      model: { eu_work_visa: true },
      errorNoLocation: false,
      loading: false,
      ready: false,
    });


    Loader.page(true);
    return onLoad();


    function sixteenYearsAgo() {
      var date = new Date();
      date.setFullYear(date.getFullYear() - 16);
      return date;
    }

    function pan(value) {
      return value < 10 ? '0' + value : value;
    }

    function updateDob() {
      var year = $scope.dobYear;
      var month = $scope.dobMonth;
      var day = $scope.dobDay;
      var monthIndex = months.indexOf(month);
      $scope.errorTooYoung = false;
      $scope.errorInvalidDate = false;

      if (!year || !month || !day)
        return;

      var date = new Date(year, monthIndex, day, 12);
      var dateAsString = date.toISOString().split('T')[0];
      var introduced = year + '-' + pan(monthIndex + 1) + '-' + pan(day);
      var max = sixteenYearsAgo();

      $scope.errorTooYoung = date > max;
      $scope.errorInvalidDate = dateAsString !== introduced;

      if (!$scope.errorTooYoung && !$scope.errorInvalidDate)
        $scope.model.dob = dateAsString;
    }

    function onLoad() {
      return Session.getUser()
        .then(fn.invoke('getData', []))
        .then(function(data) {
          return setModel(_.omit(data, [
            'skills',
            'languages',
            'preferred_location',
            'work_experience',
            'activation_token',
            'email',
            'status',
          ]));
        })
        .finally(function() {
          $scope.ready = true;
          Loader.page(false);
        });
    }

    function submit() {
      if (!$scope.model.location) {
        $scope.locationFocus = true;
        $scope.errorNoLocation = true;
      }

      if ($scope.errorNoLocation) {
        $scope.form.location.$dirty = true;
        return;
      }

      if ($scope.errorFileImage || $scope.errorTooYoung || $scope.errorInvalidDate)
        return;

      $scope.loading = true;
      Loader.add('signup-profile-saving');

      return save().then(function() {
        return Session.refreshUser();
      }).then(function(){
        return $scope.signup.nextStep();
      }).finally(function() {
        $scope.loading = false;
        Loader.remove('signup-profile-saving');
      });
    }

    function setLocation(text) {
      $scope.model.location = ConfigAPI.getLocationFromText(text);
      $scope.errorNoLocation = !$scope.model.location;
    }

    function save() {
      return Session.getUser().then(function(user) {
        return user.updateData($scope.model).then(function() {
          var promises = [];

          if ($scope.files && $scope.files.length) {
            promises.push(Amazon.upload($scope.files[0], 'users', Session.id())
              .then(user.setPhoto.bind(user)));
          }

          if ($scope.cv_file && $scope.cv_file.length) {
            promises.push(Amazon.upload($scope.cv_file[0], 'cv', Session.id())
              .then(user.setCVUrl.bind(user)));
          }

          return $q.all(promises);
        });
      });
    }

    function setModel(model) {
      $scope.model = JSON.parse(JSON.stringify(model));
      $scope.selectedFiles = [ model.picture_url ];

      Object.keys($scope.model).forEach(function(key) {
        if ($scope.model[key] == null)
          delete $scope.model[key];
      });

      if ('dob' in $scope.model)
        $scope.model.dob = new Date($scope.model.dob);
      if (!('eu_work_visa' in $scope.model))
        $scope.model.eu_work_visa = true;
    }

    function selectFile(files) {
      $scope.model.picture_url = null;
      if (files.length)
        $scope.errorFileImage = files[0].type.indexOf('image/') !== 0;
    }
  });

  return {
    url: '/profile/',
    template: require('text!./candidate-signup-profile.html'),
    controller: 'CandidateSignupProfileCtrl',
    controllerAs: 'signupProfile',
  };
});
