define(function(require) {
  'use strict';
  require('tools/candidate-session');
  var module = require('app-module');

  module.controller('CandidateActivateCtrl', function($scope, $state, CandidateSession) {
    CandidateSession.activate($state.params.token).then(function() {
      $scope.success = true;
    }, function() {
      $scope.error = true;
    });
  });


  return {
    url: '/activate/:token',
    template: require('text!./candidate-activate.html'),
    controller: 'CandidateActivateCtrl',
    controllerAs: 'activate',
  };
});
