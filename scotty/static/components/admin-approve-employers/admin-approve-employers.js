define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('AdminApproveEmployers', function($scope, toaster, Loader, Session) {
    this.filterEmployers = filterEmployers;
    this.approve = approve;
    $scope.status = 'APPLIED';
    $scope.showItems = 10;

    function filterEmployers(params) {
      params = params || { limit: $scope.showItems };
      $scope.employers = [];
      Loader.add('admin-approve-employers-filter');

      return Session.getEmployersByStatus($scope.status, params).then(function(response) {
        $scope.employers = response.data;
        $scope.total = response.pagination.total;
      }).finally(function() {
        Loader.remove('admin-approve-employers-filter');
      });
    }

    function approve(employer) {
      Loader.add('admin-approve-employers-approve');
      return Session.approveEmployer(employer).then(function() {
        employer.status = 'APPROVED';
      }).finally(function() {
        Loader.remove('admin-approve-employers-approve');
      });
    }

    filterEmployers().catch(function(err) {
      toaster.error(err.message);
    }).finally(function() {
      Loader.page(false);
    });
  });

  return {
    url: '/approve-employers/',
    template: require('text!./admin-approve-employers.html'),
    controller: 'AdminApproveEmployers',
    controllerAs: 'approveEmployers',
  };
});
