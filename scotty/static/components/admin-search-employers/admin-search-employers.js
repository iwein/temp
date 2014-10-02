define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-employer/directive-employer');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');


  module.controller('SearchEmployersCtrl', function($scope, $q, toaster, Session) {
    $scope.loadMore = loadMore;
    $scope.search = _.debounce(search, 100);
    $scope.limit = 20;
    var perStep = $scope.limit;

    function loadMore() {
      $scope.limit += perStep;
    }

    function search() {
      Session.searchEmployers({ q: $scope.term }).then(function(employers) {
        return $q.all(employers.map(fn.invoke('getData', [])));
      }).then(function(results) {
        $scope.employers = results;
      }).catch(toaster.defaultError);
    }
  });


  return {
    url: '/search-employers/',
    template: require('text!./admin-search-employers.html'),
    controller: 'SearchEmployersCtrl',
    controllerAs: 'searchEmployers',
  };
});
