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
        $scope.onFeaturedLocationChange = onFeaturedLocationChange;
        $scope.onFeaturedSkillChange = onFeaturedSkillChange;
        $scope.searchSkills = ConfigAPI.skills;
        $scope.searchCities = searchCities;
        $scope.setCountry = setCountry;
        $scope.submit = submit;
        $scope.model = $scope.model || {};
        this.save = save;
        this.reset = reset;
        this.setModel = setModel;

        nameAttr(this, 'hcTargetPositionForm', $scope, $attrs);
        ConfigAPI.featuredRoles().then(fn.setTo('featuredRoles', $scope));
        ConfigAPI.countries({ limit: 500 }).then(fn.setTo('countries', $scope));
        ConfigAPI.featuredSkills().then(toCheckboxModel('featuredSkills'));
        ConfigAPI.featuredLocations().then(toCheckboxModel('featuredLocations'));

        function toCheckboxModel(key) {
          return function(data) {
            $scope[key] = data.map(function(type) {
              return { value: type };
            });
          };
        }

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
          onFeaturedLocationChange();
        }

        function onFeaturedSkillChange() {
          if (!$scope.model.skills) $scope.model.skills = [];

          $scope.featuredSkills.forEach(function(entry) {
            var index = $scope.model.skills.indexOf(entry.value);
            if (index === -1 && entry.selected)
              $scope.model.skills.push(entry.value);
            else if (index !== -1 && !entry.selected)
              $scope.model.skills.splice(index, 1);
          });
        }

        function onFeaturedLocationChange() {
          if (!$scope.model.preferred_locations)
            $scope.model.preferred_locations = {};

          var locations = $scope.model.preferred_locations;
          $scope.featuredLocations.forEach(function(entry) {
            var country = locations[entry.value.country_iso];
            if (!country) {
              if (entry.selected)
                locations[entry.value.country_iso] = [ entry.value.city ];
              return;
            }

            var index = country.indexOf(entry.value.city);

            if (entry.selected) {
              if (index === -1)
                country.push(entry.value.city);
            } else {
              if (index === 0 && country.length === 1)
                delete locations[entry.value.country_iso];
              else if (index !== -1 && !entry.selected)
                country.splice(index, 1);
            }
          });
        }

        function save() {
          return Session.getUser().then(function(user) {
            var model = _.omit($scope.model, 'preferred_locations');
            var preferred_locations = $scope.model.preferred_locations;

            return $q.all([
              user.setPreferredLocations(preferred_locations),
              user.setTargetPosition(model),
            ]);
          });
        }

        function reset() {
          $scope.editing = false;
          $scope.model = {};
          $scope.country = '';
          $scope.dontCareLocation = false;
          $scope.featuredSkills.forEach(fn.set('selected', false));
          $scope.featuredLocations.forEach(fn.set('selected', false));
          $scope.formTarget.$setPristine();
        }

        function setModel(model) {
          model = JSON.parse(JSON.stringify(model));
          $scope.editing = true;
          $scope.model = model;
          $scope.country = Object.keys(model.preferred_locations)[0];
          $scope.dontCareLocation = !model.preferred_locations[$scope.country].length;
          $scope.featuredSkills.forEach(function(item) {
            item.selected = model.skills.indexOf(item.value) !== -1;
          });
          // TODO: prefill featuredLanguages
        }

        function submit() {
          $scope.onSubmit({ $model: $scope.model });
        }
      }
    };
  });
});
