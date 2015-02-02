define(function(require) {
  'use strict';
  require('tools/file-upload/amazon');
  require('tools/file-upload/data-url-directive');
  require('tools/file-upload/file-select-directive');
  var _ = require('underscore');
  var module = require('app-module');


  // jshint maxparams:7
  module.controller('SignupBasicCtrl', function($scope, $q, toaster, Loader, Session, Amazon) {
    this.selectFile = selectFile;
    this.submit = submit;
    $scope.model = {};
    Loader.page(true);

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
    }).finally(function() {
      $scope.ready = true;
      Loader.page(false);
    });

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
      if($scope.errorFileImage || !$scope.formSignupBasic.$valid)return;

      Object.keys($scope.model).forEach(function(key) {
        if (!$scope.model[key])
          delete $scope.model[key];
      });

      $scope.loading = true;
      Loader.add('signup-basic-saving');

      return Amazon.upload($scope.files[0], 'logo', Session.id()).then(function(url) {
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
        Loader.remove('signup-basic-saving');
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


