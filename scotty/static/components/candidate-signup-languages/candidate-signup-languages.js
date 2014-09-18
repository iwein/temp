define(function(require) {
  'use strict';
  require('tools/config-api');
  var module = require('app-module');

  module.controller('CandidateSignupLanguageCtrl', function($scope, ConfigAPI, Session) {
    this.searchLanguages = ConfigAPI.languages;
    this.remove = remove;
    this.setLanguage = validateLang;
    this.onBlur = onBlur;
    this.onChange = onChange;
    this.submit = submit;
    $scope.loading = false;
    var languages = $scope.model = [{}];

    Session.user.getData().then(function(data) {
      languages = $scope.model = data.languages.concat(languages);
    });

    ConfigAPI.proficiencies().then(function(data) {
      $scope.proficiencies = data;
    });

    function remove(index) {
      languages.splice(index, 1);
    }

    function validateLang(entry) {
      entry.errorInvalidLanguage = !ConfigAPI.isValidLanguage(entry.language);
    }

    function onBlur(entry, index, isLast) {
      entry.$dirty = true;
      validateLang(entry);
      if (!entry.language && !isLast)
        remove(index);
    }

    function onChange(entry, index, isLast) {
      validateLang(entry);
      if (entry.language && isLast)
        languages.push({});
    }

    function submit() {
      if ($scope.model.some(function(entry) {
        if (!entry.language) return false;
        return entry.errorInvalidLanguage;
      })) return;

      var data = languages.slice();
      data.pop();

      $scope.loading = true;
      Session.user.setLanguages(data).then(function() {
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
