define(function(require) {
  'use strict';
  require('tools/list-api');
  require('tools/search-api');
  var module = require('app-module');

  module.controller('CandidateSignupEducation1Ctrl', function($scope, ListAPI, SearchAPI) {
    this.searchInstitutions = SearchAPI.institutions;

    ListAPI.degrees().then(function(data) {
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
