define(function(require) {
  'use strict';
  require('components/directive-employer/directive-employer');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');


  module.controller('DashboardCtrl', function($scope, $q, $sce, toaster, Loader, ConfigAPI, Permission, Session) {
    $scope.searchLocations = ConfigAPI.locationsText;
    $scope.searchSkills = ConfigAPI.skills;
    $scope.setLocation = setLocation;
    $scope.search = search;
    $scope.toggle = toggle;
    $scope.ready = false;
    $scope.today = new Date();
    Loader.page(true);

    ConfigAPI.companyTypes().then(function(data) {
      $scope.companyTypes = data.map(function(type) {
        return { value: type };
      });
    });

    Permission.requireActivated().then(function() {
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

    function search() {
      var tags = $scope.terms && $scope.terms.join();
      var companyTypes = $scope.companyTypes
        .filter(fn.get('selected'))
        .map(fn.get('value'))
        .join();

      var params = _.extend({},
        $scope.location,
        tags && { tags: tags },
        companyTypes && { company_types: companyTypes }
      );

      $scope.loading = true;
      return Session.searchEmployers(params)
        .then(function(employers) {
          return $q.all(employers.map(fn.invoke('getData', [])));
        })
        .then(function(results) { $scope.employers = results })
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
