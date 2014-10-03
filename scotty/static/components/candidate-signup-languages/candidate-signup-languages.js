define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-languages-form/directive-languages-form');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.controller('CandidateSignupLanguageCtrl', function($scope, ConfigAPI, Session) {
    this.submit = submit;
    $scope.loading = false;
    $scope.ready = false;

    Session.getUser()
      .then(fn.invoke('getData', []))
      .then(function(data) {
        $scope.ready = true;
        $scope.form.setModel(data.languages);
      });

    function submit() {
      $scope.loading = true;
      $scope.form.save().then(function() {
        return $scope.signup.nextStep();
      }).finally(function() {
        $scope.loading = false;
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
