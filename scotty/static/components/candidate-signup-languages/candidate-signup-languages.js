define(function(require) {
  'use strict';
  require('tools/config-api');
  require('tools/candidate-session');
  var module = require('app-module');

  module.controller('CandidateSignupLanguageCtrl', function($scope, $state, ConfigAPI, CandidateSession) {
    this.remove = remove;
    this.onChange = onChange;
    this.submit = submit;
    var languages = $scope.signup.languages;
    languages.push({});

    ConfigAPI.languages().then(function(data) {
      $scope.languages = data;
    });

    ConfigAPI.proficiencies().then(function(data) {
      $scope.proficiencies = data;
    });

    function last() {
      return languages[languages.length - 1];
    }

    function remove(index) {
      languages.splice(index, 1);
    }

    function onChange(entry, index) {
      if (!entry.language && entry !== last())
        remove(index);
      else if (last().language)
        languages.push({});
    }

    function submit() {
      var languages = $scope.signup.languages.slice();
      languages.pop();

      CandidateSession.setLanguages(languages).then(function() {
        $scope.signup.languages.pop();
        //console.log('Next step');
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
