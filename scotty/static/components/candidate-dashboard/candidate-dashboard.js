define(function(require) {
  'use strict';
  require('components/directive-employer/directive-employer');
  var module = require('app-module');


  module.controller('DashboardCtrl', function($scope, $q, Loader, Permission, Session) {
    Loader.page(true);
    $scope.ready = false;

    Permission.requireActivated().then(function() {
      $scope.ready = true;
      return Session.getUser();
    }).then(function(user) {
      return $q.all([
        user.getNewsFeed(),
        user.getSuggestedCompanies(),
      ]);
    }).then(function(results) {
      $scope.news = results[0];
      $scope.suggested = results[1].data.slice(0, 5);
    }).finally(function() {
      Loader.page(false);
    });
  });


  return {
    url: '/dashboard/',
    template: require('text!./candidate-dashboard.html'),
    controller: 'DashboardCtrl',
    controllerAs: 'dashboard',
  };
});
