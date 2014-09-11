define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('AdminApproveEmployers', function($scope, Session) {
    this.filterEmployers = filterEmployers;
    this.approve = approve;
    $scope.status = 'APPLIED';

    function filterEmployers(status) {
      $scope.employers = [];
      Session.getEmployersByStatus(status).then(function(employers) {
        $scope.employers = employers;
      });
    }

    function approve(employer) {
      Session.approveEmployer(employer).then(function() {
        employer.status = 'APPROVED';
      });
    }

    filterEmployers($scope.status);
  });

  return {
    url: '/approve-employers/',
    template: require('text!./admin-approve-employers.html'),
    controller: 'AdminApproveEmployers',
    controllerAs: 'approveEmployers',
  };
});
