define(function(require) {
  'use strict';
  require('textangular');
  require('tools/config-api');
  require('components/directive-candidate/directive-candidate');
  require('components/partial-benefits/partial-benefits');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');


  // jshint maxparams:11
  module.controller('CreateOfferCtrl', function($scope, $q, $state, toaster, i18n,
                                                Loader, ConfigAPI, Session, RequireApproved, candidate) {
    _.extend($scope, {
      onSalaryChange: onSalaryChange,
      searchLocations: ConfigAPI.locationsText,
      searchSkills: ConfigAPI.skills,
      searchRoles: ConfigAPI.roles,
      setLocation: setLocation,
      submit: submit,
      model: {},
      loading: false,
      ready: false,
    });

    return onLoad();


    function onLoad() {
      $scope.$watch('model.job_description', function(value) {
        $scope.model.job_description = value && value.trim();
      });
      $scope.$watch('model.interview_details', function(value) {
        $scope.model.interview_details = value && value.trim();
      });

      return $q.all([
        ConfigAPI.benefits(),
        Session.getUser().then(fn.invoke('getData', [])),
        candidate.getData(),
        candidate.getTargetPosition(),
      ]).then(function(result) {
        var benefits = result[0];
        var data = result[1];
        var candidateData = result[2];
        var targetPosition = result[3];

        $scope.model.interview_details = data.recruitment_process;
        $scope.model.technologies = data.tech_tags;

        _.extend($scope, {
          candidateName: candidateData.first_name + ' ' + candidateData.last_name,
          locations: candidateData.preferred_location,
          expectedSalary: targetPosition.minimum_salary,
          candidate: candidate,
          ready: true,
          benefits: benefits.map(function(value) {
            return {
              selected: data.benefits.indexOf(value) !== -1,
              value: value,
            };
          })
        });
      }).finally(function() {
        Loader.page(false);
      });
    }

    function setLocation(location) {
      var city = ConfigAPI.getLocationFromText(location);
      $scope.errorInvalidCity = city === null;
      $scope.model.location = city;
      if (!city) return;
      var country = $scope.locations[city.country_iso];
      $scope.errorLocationUnsuitable = !country || (country.length && country.indexOf(city.city) === -1);
    }

    function onSalaryChange(salary) {
      $scope.errorSalaryTooLow = salary < $scope.expectedSalary;
    }

    function submit() {
      $scope.dirty = true;
      if (!$scope.model.job_description || !$scope.model.interview_details ||
        $scope.errorSalaryTooLow || $scope.errorLocationUnsuitable)
        return;

      Loader.add('employer-create-offer-saving');
      $scope.model.candidate = { id: $scope.candidate.id };
      $scope.model.benefits = $scope.benefits
        .filter(function(benefit) { return benefit.selected })
        .map(function(benefit) { return benefit.value });

      Session.getUser()
        .then(function(user) { return user.makeOffer($scope.model) })
        .then(function(newOffer) {
          toaster.success(i18n.gettext('Offer sent to {{ name }}', { name: $scope.candidateName }));
          $state.go('offer', {'id': newOffer.id});
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
    resolve: {
      /*@ngInject*/
      RequireApproved: function(Permission) {
        return Permission.requireApproved();
      },
      /*@ngInject*/
      candidate: function($stateParams, Session) {
        return Session.getCandidate($stateParams.id);
      },
    },
  };
});
