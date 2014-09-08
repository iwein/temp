define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');

  module.controller('AdminApproveEmployers', function($scope, Session) {
    this.approve = approve;

    $scope.employers = [{
      contact_name: 'Marius',
      company_name: 'Intel Corp.',
      status: 'applied',
    }, {
      contact_name: 'Fabio',
      company_name: 'Microsoft',
      status: 'applied',
    }, {
      contact_name: 'Eusebio',
      company_name: 'Cara gamba inc.',
      status: 'applied',
    }];

    function approve(employer) {
      Session.approveEmployer(employer).finally(function() {
        employer.status = 'approved';
      });
    }
  });

  return {
    url: '/approve-employers',
    template: require('text!./admin-approve-employers.html'),
    controller: 'AdminApproveEmployers',
    controllerAs: 'approveEmployers',
  };
});
