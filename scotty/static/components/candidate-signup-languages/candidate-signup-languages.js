define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-languages-form/directive-languages-form');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.controller('CandidateSignupLanguageCtrl', function($scope, Loader, ConfigAPI, Session) {
    this.submit = submit;
    $scope.loading = false;
    $scope.ready = false;
    var modelLoaded = false;
    Loader.page(true);

    ConfigAPI.featuredLanguages().then(function(langs) {
      if (!modelLoaded)
        $scope.form.setModel(langs.map(function(value) { return { language: value } }));
    });

    Session.getUser()
      .then(fn.invoke('getData', []))
      .then(function(data) {
        if (data.languages.length) {
          modelLoaded = true;
          $scope.form.setModel(data.languages);
        }
      })
      .finally(function() {
        $scope.ready = true;
        Loader.page(false);
      });

    function submit() {
      if(!$scope.form.$valid)return;
      $scope.loading = true;
      Loader.add('signup-languages-saving');

      $scope.form.save().then(function() {
        return $scope.signup.nextStep();
      }).finally(function() {
        $scope.loading = false;
        Loader.remove('signup-languages-saving');
      });
    }
  });

  return {
    url: '/languages/',
    template: require('text!./candidate-signup-languages.html'),
    controller: 'CandidateSignupLanguageCtrl',
    controllerAs: 'signupLanguages',
  };
});
