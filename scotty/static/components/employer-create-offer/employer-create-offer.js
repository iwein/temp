define(function(require) {
  'use strict';
  require('textangular');
  require('tools/config-api');
  require('components/directive-candidate/directive-candidate');
  var module = require('app-module');


  // jshint maxparams: 7
  module.controller('CreateOfferCtrl', function($scope, $q, $state, toaster, ConfigAPI, Permission, Session) {
    $scope.ready = false;
    Permission.requireSignup().then(function() {
      this.searchLocations = ConfigAPI.locationsText;
      this.searchSkills = ConfigAPI.skills;
      this.searchRoles = ConfigAPI.roles;
      this.setLocation = setLocation;
      this.submit = submit;
      $scope.loading = false;
      $scope.model = {};

      $q.all([
        ConfigAPI.benefits(),
        Session.user.getData(),
        Session.getCandidate($state.params.id).then(function(candidate) {
          return candidate.getData();
        }),
      ]).then(function(result) {
        var benefits = result[0];
        var data = result[1];

        $scope.ready = true;
        $scope.candidate = result[2];
        $scope.benefits = benefits.map(function(value) {
          return {
            value: value,
            selected: data.benefits.indexOf(value) !== -1,
          };
        });
      });

      $scope.$watch('model.job_description', function(value) {
        $scope.model.job_description = value && value.trim();
      });
      $scope.$watch('model.hiring_process', function(value) {
        $scope.model.job_description = value && value.trim();
      });

      function setLocation(location) {
        var city = ConfigAPI.getLocationFromText(location);
        $scope.errorInvalidCity = city === null;
        $scope.model.location = city;
      }

      function submit() {
        $scope.dirty = true;
        if (!$scope.model.job_description || !$scope.model.hiring_process)
          return;

        toaster.error('Endpoint not connected');
      }

    }.bind(this));
  });


  return {
    url: '/candidate/:id/offer',
    template: require('text!./employer-create-offer.html'),
    controller: 'CreateOfferCtrl',
    controllerAs: 'createOffer',
  };
});

/*
ng-model="model.annual_salary"
ng-model="model.role"
ng-model="model.skills"
<text-angular required ng-model="model.job_description"></text-angular>
<text-angular required ng-model="model.hiring_process"></text-angular>
<li class="list-group-item" ng-repeat="benefit in benefits">
ng-model="benefit.selected">
{{ benefit.value }}
*/
