define(function(require) {
  'use strict';
  var module = require('app-module');

  module.controller('CandidateRegisterCtrl', function($scope, $http) {
    $scope.getSkills = getSkills;

    function getSkills(term) {
      return $http.get('http://localhost/api/v1/config/skills?q=' + term)
        .then(function(response) {
          return response.data.data;
        });
    }
  });
});
