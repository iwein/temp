define(function(require) {
  'use strict';
  require('angular-sanitize');
  require('session');
  var module = require('app-module');

  module.controller('EmployerProfileCtrl', function($scope, $sce, $state, toaster, Session) {
    $scope.id = $state.params.id;
    $scope.ready = false;
    this.toogleBookmark = toogleBookmark;

    getIsBookmarked();

    function getIsBookmarked() {
      Session.getBookmarks().then(function(results) {
        $scope.isBookmarked = results.some(function(employer) {
          return employer.id === $scope.id;
        });
      });
    }

    function toogleBookmark() {
      ($scope.isBookmarked ?
        Session.deleteBookmark({ id: $scope.id }) :
        Session.addBookmark({ id: $scope.id })
      ).then(function() {
        return getIsBookmarked();
      }).catch(function() {
        toaster.defaultError();
      });
    }

    Session.getEmployerData($scope.id).then(function(data) {
      $scope.ready = true;
      $scope.data = data;
      $scope.data.mission_text = $sce.trustAsHtml(data.mission_text);
    }).catch(function() {
      toaster.defaultError();
    });
  });


  return {
    url: '/employer/:id',
    template: require('text!./candidate-employer-profile.html'),
    controller: 'EmployerProfileCtrl',
    controllerAs: 'employerProfile',
  };
});
