define(function(require) {
  'use strict';
  require('angular-sanitize');
  require('components/directive-office/directive-office');
  var module = require('app-module');

  module.controller('EmployerProfileCtrl', function($scope, $sce, $state, toaster, Permission, Session) {
    $scope.ready = false;

    Permission.requireLogged().then(function() {
      this.toogleBookmark = toogleBookmark;
      $scope.id = $state.params.id;

      getIsBookmarked();

      Session.getEmployer($scope.id).then(function(employer) {
        $scope.employer = employer;
        return employer.getData();
      }).then(function(data) {
        $scope.ready = true;
        $scope.data = data;
        $scope.data.mission_text = $sce.trustAsHtml(data.mission_text);
      }).catch(function() {
        toaster.defaultError();
      });


      function getIsBookmarked() {
        return Session.user.getBookmarks().then(function(results) {
          $scope.isBookmarked = results.some(function(employer) {
            return employer.id === $scope.id;
          });
          return $scope.isBookmarked;
        });
      }

      function toogleBookmark() {
        ($scope.isBookmarked ?
          Session.user.deleteBookmark({ id: $scope.id }) :
          Session.user.addBookmark({ id: $scope.id })
        ).then(function() {
          return getIsBookmarked();
        }).then(function(isBookmarked) {
          toaster.success(isBookmarked ? 'Employer bookmarked' : 'Bookmark removed');
        }).catch(function() {
          toaster.defaultError();
        });
      }
    }.bind(this));
  });


  return {
    url: '/employer/:id',
    template: require('text!./candidate-employer-profile.html'),
    controller: 'EmployerProfileCtrl',
    controllerAs: 'employerProfile',
  };
});
