define(function(require) {
  'use strict';
  require('tools/candidate-session');
  var module = require('app-module');

  module.controller('CandidateHomeCtrl', function($scope, CandidateSession) {
    $scope.logout = CandidateSession.logout;
  });
});
