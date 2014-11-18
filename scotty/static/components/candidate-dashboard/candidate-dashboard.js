define(function(require) {
  'use strict';
  require('components/directive-employer/directive-employer');
  var module = require('app-module');


  module.controller('DashboardCtrl', function($scope, $q, $sce, Loader, Permission, Session) {
    Loader.page(true);
    $scope.toggle = toggle;
    $scope.ready = false;
    $scope.today = new Date();

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
  });


  return {
    url: '/dashboard/',
    template: require('text!./candidate-dashboard.html'),
    controller: 'DashboardCtrl',
    controllerAs: 'dashboard',
  };
});
