define(function(require) {
  'use strict';
  require('tools/config-api');
  var module = require('app-module');

  module.controller('CandidateSignupEducation1Ctrl', function($scope, ConfigAPI) {
    this.searchInstitutions = ConfigAPI.institutions;

    ConfigAPI.degrees().then(function(data) {
      $scope.degrees = data;
    });
  });

  return {
    url: '/education',
    template: require('text!./candidate-signup-education1.html'),
    controller: 'CandidateSignupEducation1Ctrl',
    controllerAs: 'signupEducation1',
  };
});
