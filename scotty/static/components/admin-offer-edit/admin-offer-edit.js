define(function(require) {
  'use strict';
  require('textangular');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');


  // jshint maxparams:9
  module.controller('AdminOfferEdit', function($scope, $state, toaster, Loader, ConfigAPI, Session,
                                              benefits, offer, limits) {
    var model = offer.data;
    var location = ConfigAPI.locationToText(model.location);

    _.extend($scope, {
      searchLocations: ConfigAPI.locationsText,
      searchSkills: ConfigAPI.skills,
      searchRoles: ConfigAPI.roles,
      onSalaryChange: onSalaryChange,
      setLocation: setLocation,
      submit: submit,
      locationText: location,
      model: model,
    });

    return onLoad();


    function onLoad() {
      $scope.$watch('model.job_description', function(value) {
        $scope.model.job_description = value && value.trim();
      });
      $scope.$watch('model.interview_details', function(value) {
        $scope.model.interview_details = value && value.trim();
      });

      $scope.benefits = benefits.map(function(value) {
        return {
          selected: model.benefits.indexOf(value) !== -1,
          value: value,
        };
      });
    }

    function onSalaryChange(salary) {
      $scope.errorSalaryTooLow = salary < limits.salary;
    }

    function setLocation(location) {
      var city = ConfigAPI.getLocationFromText(location);
      $scope.errorInvalidCity = city === null;
      $scope.model.location = city;

      if (!city)
        return;

      var country = limits.locations[city.country_iso];
      $scope.errorLocationUnsuitable = (
        !country ||
        (country.length && country.indexOf(city.city) === -1)
      );
    }

    function submit() {
      $scope.dirty = true;
      if (!$scope.model.job_description ||
        !$scope.model.interview_details ||
        $scope.errorSalaryTooLow ||
        $scope.errorLocationUnsuitable)
        return;

      var data = _.pick(model, 'message', 'role', 'technologies', 'location',
        'annual_salary', 'interview_details', 'job_description', 'other_benefits');

      Loader.add('admin-edit-offer');
      data.benefits = $scope.benefits
          .filter(fn.get('selected'))
          .map(fn.get('value'));

      return Session.editOffer(offer.id, data).then(function() {

        toaster.success('Offer updated');
        $state.go('offer', { id: offer.id });
      })
      .catch(toaster.defaultError)
      .finally(function() { Loader.remove('admin-edit-offer') });
    }
  });


  return {
    url: '/offer/:id/edit',
    template: require('text!./admin-offer-edit.html'),
    controller: 'AdminOfferEdit',
    resolve: {
      /*@ngInject*/
      benefits: function(ConfigAPI) {
        return ConfigAPI.benefits();
      },
      /*@ngInject*/
      offer: function($stateParams, Session) {
        return Session.getOffer($stateParams.id);
      },
      /*@ngInject*/
      limits: function($q, Session, offer) {
        var id = offer.data.candidate.id;
        return Session.getCandidate(id).then(function(candidate) {
          return $q.all([
            candidate.getData(),
            candidate.getTargetPosition(),
          ]);
        }).then(function(result) {
          return {
            locations: result[0].preferred_location,
            salary: result[1].minimum_salary,
          };
        });
      },
    },
  };
});
