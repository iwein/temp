define(function(require) {
  'use strict';
  require('angular-sanitize');
  require('components/directive-office/directive-office');
  require('components/partial-benefits/partial-benefits');
  var module = require('app-module');


  // jshint maxparams:7
  module.controller('EmployerProfileCtrl', function($scope, $sce, $state, toaster, Loader, Permission, Session) {
    Loader.page(true);
    $scope.ready = false;

    Permission.requireSignup().then(function() {
      $scope.toggle = toggle;
      $scope.id = $state.params.id;

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

      Loader.add('candidate-employer-profile-isbookmarked');
      Session.getUser().then(function(user) {
        $scope.candidate_has_been_hired = user._data.candidate_has_been_hired;
        $scope.candidate_is_approved = user._data.is_approved;
        $scope.candidate_is_activated = user._data.is_activated;
        $scope.candidate_is_bookmarked = user._data.employer_bookmarked;
        $scope.candidate_is_blacklisted = user._data.employer_blacklisted;

        $scope.can_act =
          $scope.candidate_is_activated &&
          $scope.candidate_is_approved &&
          !$scope.candidate_is_blacklisted &&
          !$scope.candidate_has_been_hired;
      }).finally(function() {
        Loader.remove('candidate-employer-profile-isbookmarked');
      });

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
