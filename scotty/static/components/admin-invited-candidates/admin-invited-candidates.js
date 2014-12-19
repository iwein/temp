define(function(require) {
  'use strict';
  require('session');
  require('tools/config-api');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.controller('InvitedCandidates', function($scope, $state, Loader, Session) {
    $scope.getPage = getPage;
    $scope.ready = false;
    var itemsPerPage = 10;
    var code = $state.params.code;

    getPage(0);

    function getPage(index) {
      Session.getInvitedCandidates(code, {
        offset: index * itemsPerPage,
        limit: itemsPerPage,
      }).then(function(result) {
        $scope.candidates = result.data;
        $scope.currentPage = index;
        $scope.pages = [];
        $scope.ready = true;

        var pages = Math.ceil(result.pagination.total / itemsPerPage) || 0;
        for (var i = 0; i < pages; i++)
          $scope.pages.push(i);
      });
    }
  });

  return {
    url: '/invite-code/:code/',
    template: require('text!./admin-invited-candidates.html'),
    controller: 'InvitedCandidates',
  };
});
