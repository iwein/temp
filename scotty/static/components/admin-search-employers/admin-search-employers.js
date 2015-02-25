define(function(require) {
  'use strict';
  require('tools/table-utils/sort/sort-field-directive');
  require('components/admin-directive-search/admin-directive-search');
  require('components/directive-employer/directive-employer');
  var module = require('app-module');


  module.controller('SearchEmployersCtrl', function($scope, Session) {
    $scope.executeSearch = executeSearch;

    $scope.status = 'APPROVED';
    $scope.statuses = ['INVITED', 'SIGNEDUP', 'APPLIED', 'APPROVED', 'DELETED'];

    function executeSearch(params) {
      return Session.searchEmployers(params);
    }
  });

  return {
    url: '/search-employers/',
    template: require('text!./admin-search-employers.html'),
    controller: 'SearchEmployersCtrl',
    controllerAs: 'searchEmployers',
  };
});
