define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('AdminApproveEmployers', function($scope, Loader, Session) {
    this.filterEmployers = filterEmployers;
    this.approve = approve;
    $scope.status = 'APPLIED';

    function filterEmployers(status) {
      $scope.employers = [];
      Loader.add('admin-approve-employers-filter');
      return Session.getEmployersByStatus(status).then(function(employers) {
        $scope.employers = employers;
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

    filterEmployers($scope.status).finally(function() {
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
