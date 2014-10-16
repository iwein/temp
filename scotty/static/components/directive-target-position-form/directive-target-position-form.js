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
        onSubmit: '&',
        hcShowEmpty: '=',
      },
      transclude: true,
      template: require('text!./directive-target-position-form.html'),
      controllerAs: 'targetPositionForm',
      controller: function($scope, $attrs, $q, ConfigAPI, Session) {
        $scope.onFeaturedSkillChange = onFeaturedSkillChange;
        $scope.onSalaryChange = onSalaryChange;
        $scope.locationToText = ConfigAPI.locationToText;
        $scope.searchCities = ConfigAPI.locations;
        $scope.updateLocations = updateLocations;
        $scope.searchSkills = searchSkills;
        $scope.submit = submit;
        $scope.model = $scope.model || {};
        $scope.model.preferred_locations = $scope.model.preferred_locations || {};
        $scope.locationRadio = 'anywhere';
        $scope.preferred_locations = [];
        this.save = save;
        this.reset = reset;
        this.setModel = setModel;

        nameAttr(this, 'hcTargetPositionForm', $scope, $attrs);
        ConfigAPI.featuredRoles().then(fn.setTo('featuredRoles', $scope));
        ConfigAPI.featuredSkills().then(toCheckboxModel('featuredSkills'));
        ConfigAPI.featuredLocations().then(toCheckboxModel('featuredLocations'));

        function addLocation(locations, entry) {
          if (!locations[entry.country_iso])
            locations[entry.country_iso] = [ entry.city ];
          else
            locations[entry.country_iso].push(entry.city);
        }

        function updateLocations() {
          var locations = {};
          var add = addLocation.bind(null, locations);
          $scope.errorLocationRequired = false;
          $scope.model.preferred_locations = locations;

          $scope.featuredLocations
            .filter(fn.get('selected'))
            .map(fn.get('value'))
            .forEach(add);

          if ($scope.locationRadio !== 'anywhere') {
            $scope.preferred_locations.forEach(add);
            $scope.errorLocationRequired = !Object.keys(locations).length;
          }
        }

        function searchSkills(term) {
          var skills = $scope.featuredSkills
            .filter(fn.get('selected'))
            .map(fn.get('value'));

          return ConfigAPI.skills(term).then(function(data) {
            return data.filter(function(entry) {
              return skills.indexOf(entry) === -1;
            });
          });
        }

        function toCheckboxModel(key) {
          return function(data) {
            $scope[key] = data.map(function(type) {
              return { value: type };
            });
          };
        }

        function onFeaturedSkillChange() {
          $scope.skillSelected = $scope.featuredSkills.some(function(entry) {
            return entry.selected;
          });

          $scope.model.featuredSkills = $scope.featuredSkills
            .filter(fn.get('selected'))
            .map(fn.get('value'));
        }

        function save() {
          return Session.getUser().then(function(user) {
            var model = _.omit($scope.model, 'preferred_locations', 'featuredSkills');
            var preferred_locations = $scope.model.preferred_locations;
            model.skills = [].concat(model.skills || [], $scope.model.featuredSkills || []);

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
          $scope.featuredSkills.forEach(function(item) {
            item.selected = model.skills.indexOf(item.value) !== -1;
          });

          var countries = Object.keys(model.preferred_locations);
          $scope.locationRadio = countries.length ? 'other' : 'anywhere';
          $scope.preferred_locations = [];
          // TODO: prefill featuredLanguages

          countries.forEach(function(country) {
            model.preferred_locations[country].forEach(function(city) {
              $scope.preferred_locations.push({
                country_iso: country,
                city: city,
              });
            });
          });
        }

        function onSalaryChange() {
          $scope.errorSalaryTooHigh = $scope.model.minimum_salary > 99000000;
        }

        function submit() {
          if ($scope.errorSalaryTooHigh)
            return;

          $scope.onSubmit({ $model: $scope.model });
        }
      }
    };
  });
});
