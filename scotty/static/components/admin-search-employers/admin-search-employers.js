define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-employer/directive-employer');
  var _ = require('underscore');
  var module = require('app-module');


  module.controller('SearchEmployersCtrl', function($scope, $q, toaster, Session) {
    $scope.loadMore = loadMore;
    $scope.search = _.debounce(search, 200);
    var show = 5;
    var counter = 0;

    function reset() {
      $scope.loading = false;
      $scope.loaded = false;
      $scope.employers = [];
      $scope.total = 0;
      counter++;
    }

    function getEmployers(offset) {
      $scope.loading = true;
      var instance = ++counter;
      var params = {
        q: $scope.term,
        limit: show,
      };

      if (offset)
        params.offset = offset;

      return Session.searchEmployers(params).then(function(response) {
        // if another call was made after this one...
        if (instance !== counter)
          return null;

        $scope.total = response.pagination.total;
        $scope.loading = false;
        $scope.loaded = true;
        return response.data;
      }).catch(toaster.defaultError);
    }

    function loadMore() {
      getEmployers($scope.employers.length).then(function(employers) {
        if (employers)
          $scope.employers = $scope.employers.concat(employers);
      });
    }

    function search() {
      if (!$scope.term) {
        $scope.$apply(reset);
        return;
      }

      getEmployers().then(function(employers) {
        if (employers)
          $scope.employers = employers;
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
