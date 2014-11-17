define(function(require) {
  'use strict';
  require('textangular');
  require('tools/config-api');
  require('components/directive-candidate/directive-candidate');
  var fn = require('tools/fn');
  var module = require('app-module');


  // jshint maxparams:8
  module.controller('CreateOfferCtrl', function($scope, $q, $state, toaster, Loader, ConfigAPI, Permission, Session) {
    this.searchLocations = ConfigAPI.locationsText;
    this.searchSkills = ConfigAPI.skills;
    this.searchRoles = ConfigAPI.roles;
    this.setLocation = setLocation;
    this.submit = submit;
    $scope.ready = false;
    Loader.page(true);

    Permission.requireActivated().then(function() {
      $scope.loading = false;
      $scope.model = {};

      $scope.$watch('model.job_description', function(value) {
        $scope.model.job_description = value && value.trim();
      });
      $scope.$watch('model.interview_details', function(value) {
        $scope.model.interview_details = value && value.trim();
      });

      return $q.all([
        ConfigAPI.benefits(),
        Session.getUser().then(fn.invoke('getData', [])),
        Session.getCandidate($state.params.id),
      ]);
    }).then(function(result) {
      var benefits = result[0];
      var data = result[1];
      var candidate = result[2];

      $scope.ready = true;
      $scope.candidate = candidate;
      $scope.model.technologies = data.tech_tags;
      $scope.model.interview_details = data.recruitment_process;
      $scope.benefits = benefits.map(function(value) {
        return {
          value: value,
          selected: data.benefits.indexOf(value) !== -1,
        };
      });

      return candidate.getData();
    }).then(function(data) {
      $scope.candidateName = data.first_name + ' ' + data.last_name;
    }).finally(function() {
      Loader.page(false);
    });

    function setLocation(location) {
      var city = ConfigAPI.getLocationFromText(location);
      $scope.errorInvalidCity = city === null;
      $scope.model.location = city;
    }

    function submit() {
      $scope.dirty = true;
      if (!$scope.model.job_description || !$scope.model.interview_details)
        return;

      Loader.add('employer-create-offer-saving');
      $scope.model.candidate = { id: $scope.candidate.id };
      $scope.model.benefits = $scope.benefits
        .filter(function(benefit) { return benefit.selected })
        .map(function(benefit) { return benefit.value });

      Session.getUser()
        .then(function(user) { return user.makeOffer($scope.model) })
        .then(function() {
          toaster.success('Offer sent to ' + $scope.candidateName);
          $state.go('dashboard');
        })
        .catch(function(request) {
          if (request && request.data && request.data.db_message)
            toaster.error(request.data.db_message);
          else
            throw request;
        })
        .catch(toaster.defaultError)
        .finally(function() { Loader.remove('employer-create-offer-saving') });
    }
  });


  return {
    url: '/candidate/:id/offer',
    template: require('text!./employer-create-offer.html'),
    controller: 'CreateOfferCtrl',
    controllerAs: 'createOffer',
  };
});
