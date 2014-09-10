define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('AdminApproveEmployers', function($scope, Session) {
    this.filterEmployers = filterEmployers;
    this.approve = approve;
    $scope.status = 'applied';

    var employers = [{
      contact_name: 'Marius',
      company_name: 'Intel Corp.',
      status: 'applied',
    }, {
      contact_name: 'Fabio',
      company_name: 'Microsoft',
      status: 'applied',
    }, {
      contact_name: 'Foo',
      company_name: 'A',
      status: 'applied',
    }, {
      contact_name: 'Bar',
      company_name: 'B',
      status: 'status4',
    }, {
      contact_name: 'Quz',
      company_name: 'C',
      status: 'signedup',
    }, {
      contact_name: 'Eusebio',
      company_name: 'Cara gamba inc.',
      status: 'approved',
    }];

    function approve(employer) {
      Session.approveEmployer(employer).finally(function() {
        employer.status = 'approved';
      });
    }

    function filterEmployers(status) {
      $scope.employers = employers.filter(function(employer) {
        return employer.status === status;
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
