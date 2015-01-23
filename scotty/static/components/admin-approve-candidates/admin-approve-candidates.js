define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('AdminApproveCandidates', function($scope, toaster, Loader, Session) {
    this.filterCandidates = filterCandidates;
    this.approve = approve;
    $scope.status = 'pending';
    $scope.showItems = 10;

    function filterCandidates(params) {
      params = params || { limit: $scope.showItems };
      $scope.candidates = [];
      Loader.add('admin-approve-candidates-filter');

      return Session.getCandidatesByStatus($scope.status, params).then(function(response) {
        $scope.total = response.pagination.total;
        $scope.candidates = response.data;
      }).finally(function() {
        Loader.remove('admin-approve-candidates-filter');
      });
    }

    function approve(candidate) {
      Loader.add('admin-approve-candidates-approve');
      return Session.approveCandidate(candidate).then(function() {
        candidate._data.status = 'APPROVED';
      }).finally(function() {
        Loader.remove('admin-approve-candidates-approve');
      });
    }

    filterCandidates().catch(function(err) {
      toaster.error(err.message);
    }).finally(function() {
      Loader.page(false);
    });
  });

  return {
    url: '/approve-candidates/',
    template: require('text!./admin-approve-candidates.html'),
    controller: 'AdminApproveCandidates',
    controllerAs: 'approveCandidates',
  };
});
