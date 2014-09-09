define(function(require) {
  'use strict';
  require('tools/config-api');
  require('session');
  var module = require('app-module');

  module.controller('CandidateSignupLanguageCtrl', function($scope, ConfigAPI, Session) {
    this.remove = remove;
    this.onChange = onChange;
    this.submit = submit;
    $scope.loading = false;
    var languages = $scope.model = [{}];

    ConfigAPI.languages().then(function(data) {
      $scope.languages = data;
    });

    ConfigAPI.proficiencies().then(function(data) {
      $scope.proficiencies = data;
    });

    function remove(index) {
      languages.splice(index, 1);
    }

    function onChange(entry, index, isLast) {
      if (!entry.language && !isLast)
        remove(index);
      else if (entry.language && isLast)
        languages.push({});
    }

    function submit() {
      var data = languages.slice();
      data.pop();

      $scope.loading = true;
      Session.setLanguages(data).then(function() {
        return $scope.signup.nextStep();
      }).finally(function() {
        $scope.loading = false;
      });
    }
  });

  return {
    url: '/languages',
    template: require('text!./candidate-signup-languages.html'),
    controller: 'CandidateSignupLanguageCtrl',
    controllerAs: 'signupLanguages',
  };
});
