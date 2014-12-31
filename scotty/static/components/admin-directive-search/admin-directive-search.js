define(function(require) {
  'use strict';
  var _ = require('underscore');
  var nameAttr = require('tools/name-attr');
  var module = require('app-module');

  module.directive('hcAdminSearch', function() {
    return {
      restrict: 'EA',
      transclude: true,
      template: require('text!./admin-directive-search.html'),
      scope: {
        onSearch: '&',
        hcShowSkills: '=',
      },
      controller: function($scope, $attrs, toaster, ConfigAPI) {
        $scope.searchSkills = ConfigAPI.skills;
        $scope.loadPage = loadPage;
        $scope.search = _.debounce(search, 200);
        $scope.output = [];
        $scope.tags = [];
        var show = 20;
        var counter = 0;

        nameAttr(this, 'hcAdminSearch', $scope, $attrs);
        search();

        function reset() {
          $scope.loading = false;
          $scope.loaded = false;
          $scope.results = [];
          $scope.total = 0;
          counter++;
        }

        function getResults(page) {
          $scope.loading = true;
          var instance = ++counter;
          var params = { limit: show };

          if ($scope.term)
            params.q = $scope.term;

          if ($scope.tags.length)
            params.tags = $scope.tags;

          if (page)
            params.offset = page * show;

          return $scope.onSearch({ $params: params })
            .then(function(response) {
              // if another call was made after this one...
              if (instance !== counter)
                return null;

              $scope.total = response.pagination.total;
              $scope.$parent.results = response.data;
              $scope.results = response.data;
              $scope.loaded = true;
              $scope.currentPage = page;
              //document.body.scrollTop = 0
            })
            .catch(toaster.defaultError)
            .finally(function() {
              $scope.loading = false;
            });
        }

        function loadPage(page) {
          $scope.loaded = false;
          return getResults(page - 1);
        }

        function search() {
          getResults(0).then(function() {
            var pages = Math.ceil($scope.total / show);
            $scope.pages = [];
            for (var i = 0; i < pages; i++)
              $scope.pages.push(i + 1);
          });
        }
      },
    };
  });
});
