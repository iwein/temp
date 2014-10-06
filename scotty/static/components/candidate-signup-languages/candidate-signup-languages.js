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
    Loader.page(true);

    Session.getUser()
      .then(fn.invoke('getData', []))
      .then(function(data) { $scope.form.setModel(data.languages) })
      .finally(function() {
        $scope.ready = true;
        Loader.page(false);
      });

    function submit() {
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
