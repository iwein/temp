define(function(require) {
  'use strict';
  require('angular-sanitize');
  require('components/directive-office/directive-office');
  var module = require('app-module');


  // jshint maxparams:7
  module.controller('EmployerProfileCtrl', function($scope, $sce, $state, toaster, Loader, Permission, Session) {
    Loader.page(true);
    $scope.ready = false;

    Session.isActivated().then(function(activated) {
      $scope.activated = activated;
    });

    Permission.requireSignup().then(function() {
      this.toogleBookmark = toogleBookmark;
      $scope.toggle = toggle;
      $scope.id = $state.params.id;
      $scope.approved = Session.isActivated();

      getIsBookmarked();

      Session.getEmployer($scope.id).then(function(employer) {
        $scope.employer = employer;
        return employer.getData();
      }).then(function(data) {
        $scope.ready = true;
        $scope.data = data;
        $scope.data.tech_team_philosophy = $sce.trustAsHtml(data.tech_team_philosophy);
        $scope.data.recruitment_process = $sce.trustAsHtml(data.recruitment_process);
        $scope.data.training_policy = $sce.trustAsHtml(data.training_policy);
        $scope.data.mission_text = $sce.trustAsHtml(data.mission_text);
      }).catch(function() {
        toaster.defaultError();
      }).finally(function() {
        Loader.page(false);
      });


      function getIsBookmarked() {
        Loader.add('candidate-employer-profile-isbookmarked');
        return Session.getUser().then(function(user) {
          return user.getBookmarks();
        }).then(function(results) {
          $scope.isBookmarked = results.some(function(employer) {
            return employer.id === $scope.id;
          });
          return $scope.isBookmarked;
        }).finally(function() {
          Loader.remove('candidate-employer-profile-isbookmarked');
        });
      }

      function toogleBookmark() {
        Loader.add('candidate-employer-profile-toggle');
        return Session.getUser().then(function(user) {
          return $scope.isBookmarked ?
            user.deleteBookmark({ id: $scope.id }) :
            user.addBookmark({ id: $scope.id });
        }).then(function() {
          return getIsBookmarked();
        }).then(function(isBookmarked) {
          toaster.success(isBookmarked ? 'Offer requested' : 'Request removed');
        }).catch(function() {
          toaster.defaultError();
        }).finally(function() {
          Loader.remove('candidate-employer-profile-toggle');
        });
      }

      function toggle(key) {
        $scope[key] = !$scope[key];
      }
    }.bind(this));
  });


  return {
    url: '/employer/:id',
    template: require('text!./candidate-employer-profile.html'),
    controller: 'EmployerProfileCtrl',
    controllerAs: 'employerProfile'
  };
});
