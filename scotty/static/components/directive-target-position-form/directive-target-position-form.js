define(function(require) {
  'use strict';
  require('session');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var nameAttr = require('tools/name-attr');
  var module = require('app-module');

  module.directive('hcTargetPositionForm', function() {
    return {
      restrict: 'EA',
      scope: {
        //model: '=ngModel',
        onSubmit: '&',
        hcShowEmpty: '=',
      },
      transclude: true,
      template: require('text!./directive-target-position-form.html'),
      controllerAs: 'targetPositionForm',
      controller: function($scope, $attrs, $q, ConfigAPI, Session) {
        $scope.searchSkills = ConfigAPI.skills;
        $scope.searchRoles = ConfigAPI.roles;
        $scope.searchCities = searchCities;
        $scope.setCountry = setCountry;
        $scope.onCompanyTypeChange = onCompanyTypeChange;
        $scope.submit = submit;
        $scope.model = $scope.model || {};
        this.save = save;
        this.reset = reset;
        this.setModel = setModel;

        nameAttr(this, 'hcTargetPositionForm', $scope, $attrs);
        ConfigAPI.travelWillingness().then(fn.setTo('willingness', $scope));
        ConfigAPI.countries({ limit: 500 }).then(fn.setTo('countries', $scope));
        ConfigAPI.companyTypes().then(function(data) {
          $scope.companyTypes = data.map(function(type) {
            return { value: type };
          });
        });

        function searchCities(value) {
          return ConfigAPI.locations({
            country_iso: $scope.country,
            q: value,
          }).then(function(locations) {
            return locations.map(fn.get('city'));
          });
        }

        function setCountry(country) {
          var model = $scope.model.preferred_locations = {};
          model[country] = [];
        }

        function onCompanyTypeChange() {
          $scope.model.company_types = $scope.companyTypes
            .filter(fn.get('selected'))
            .map(fn.get('value'));

          $scope.errorNoCompanyType = !$scope.model.company_types.length;
        }

        function save() {
          var model = _.omit($scope.model, 'preferred_locations');
          var preferred_locations = $scope.model.preferred_locations;
          return $q.all([
            Session.user.addTargetPosition(model),
            Session.user.setPreferredLocations(preferred_locations),
          ]);
        }

        function reset() {
          $scope.model = {};
          $scope.country = '';
          $scope.dontCareLocation = false;
          $scope.companyTypes.forEach(fn.set('selected', false));
          $scope.formTarget.$setPristine();
        }

        function setModel(model) {
          $scope.model = model;
          $scope.country = Object.keys(model.preferred_locations)[0];
          $scope.dontCareLocation = !model.preferred_locations[$scope.country].length;
          $scope.companyTypes.forEach(function(item) {
            item.selected = model.company_types.indexOf(item.value) !== -1;
          });
        }

        function submit() {
          if (!$scope.errorNoCompanyType)
            $scope.onSubmit({ $model: $scope.model });
        }
      }
    };
  });
});
