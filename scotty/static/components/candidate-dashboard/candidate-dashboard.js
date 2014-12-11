define(function(require) {
  'use strict';
  require('components/directive-employer/directive-employer');
  require('components/partial-candidate-newsitem/partial-candidate-newsitem');

  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');


  module.controller('DashboardCtrl', function($scope, $q, $sce, toaster, Loader, ConfigAPI, Permission, Session) {
    $scope.searchLocations = ConfigAPI.locationsText;
    $scope.searchSkills = ConfigAPI.skills;
    $scope.setLocation = setLocation;
    $scope.loadPage = loadPage;
    $scope.search = search;
    $scope.terms = [];
    $scope.toggle = toggle;
    $scope.ready = false;
    $scope.today = new Date();
    var resultsPerPage = 10;
    Loader.page(true);

    Permission.requireSignup().then(function() {
      $scope.ready = true;
      return Session.getUser();
    }).then(function(user) {
      return $q.all([
        user.getNewsFeed(),
        user.getSuggestedCompanies(),
        user.getBookmarks(),
      ]);
    }).then(function(results) {
      $scope.news = results[0];
      $scope.suggested = results[1].data.slice(0, 5);
      $scope.bookmarks = results[2];

      $scope.suggested.forEach(function(employer) {
        employer.mission_text = $sce.trustAsHtml(employer.mission_text);
        employer.isBookmarked = $scope.bookmarks.some(function(entry) {
          return entry.id === employer.id;
        });
      });
    }).finally(function() {
      Loader.page(false);
    });

    function toggle(key) {
      $scope[key] = !$scope[key];
    }

    function setLocation(text) {
      $scope.location = ConfigAPI.getLocationFromText(text || $scope.locationText);
      search();
    }

    function loadPage(page) {
      $scope.employers = $scope.searchResults.slice(page * resultsPerPage, (page + 1) * resultsPerPage);
      $scope.page = page;
    }

    function search() {
      var tags = $scope.terms && $scope.terms.join();

      var params = _.extend({},
        $scope.location,
        tags && { tags: tags }
      );

      $scope.loading = true;
      return Session.searchEmployers(params)
        .then(function(employers) {
          return $q.all(employers.map(fn.invoke('getData', [])));
        })
        .then(function(results) {
          var pagesCount = results.length / resultsPerPage;
          var pages = [];

          for (var i = 0; i < pagesCount; i++)
            pages.push(i + 1);

          $scope.searchResults = results;
          $scope.pages = pages;
          loadPage(0);
        })
        .catch(toaster.defaultError)
        .finally(function() {
          $scope.loading = false;
        });
    }
  });


  return {
    url: '/dashboard/',
    template: require('text!./candidate-dashboard.html'),
    controller: 'DashboardCtrl',
    controllerAs: 'dashboard',
  };
});
