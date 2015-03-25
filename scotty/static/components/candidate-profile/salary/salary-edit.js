define(function(require) {
  'use strict';
  require('tools/label-typeahead-directive/label-typeahead-directive');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var parser = require('./salary-parser');
  var module = require('app-module');


  module.directive('hcCandidateSalaryEdit', function(ConfigAPI) {
    var featuredLocations = [];
    ConfigAPI.featuredLocations().then(function(response) {
      featuredLocations = response;
    });


    return {
      template: require('text!./salary-edit.html'),
      scope: { model: '=', },
      link: function(scope) {
        // For some reason JSHint complains if I move this function to the end
        function close() {
          scope.editing = false;
          return profile.closeForm('salary');
        }


        var profile = scope.profile = scope.$parent.profile;
        _.extend(scope, {
          locationToText: ConfigAPI.locationToText,
          searchCities: ConfigAPI.locations,
          updateLocations: updateLocations,
          onSalaryChange: onSalaryChange,
          close: close,
          edit: edit,
          save: save,
        });


        function edit() {
          scope.data = parser.get(scope.model);
          scope.editing = true;
          _.extend(scope, parseLocations(scope.data.locations));
          return profile.openForm('salary');
        }

        function save() {
          scope.loading = true;
          return parser.set(scope.model, scope.data)
            .then(close)
            .finally(function() { scope.loading = false });
        }

        function onSalaryChange() {
          scope.errorSalaryTooHigh = scope.data.salary > 99000000;
        }

        function updateLocations() {
          if (!scope.data) return;

          var locations = {};
          var add = addLocation.bind(null, locations);
          scope.errorLocationRequired = false;
          scope.data.locations = locations;

          scope.featured
            .filter(fn.get('selected'))
            .map(fn.get('value'))
            .forEach(add);

          if (scope.germany)
            locations.DE = [];

          if (scope.other) {
            scope.list.forEach(add);
            scope.errorLocationRequired = !Object.keys(locations).length;
          }
        }
      }
    };

    function parseLocations(locations) {
      locations = JSON.parse(JSON.stringify(locations));

      var featured = featuredLocations.map(function(value) {
        return { value: value, selected: false };
      });
      var result = {
        featured: featured,
        germany: false,
        other: false,
        list: [],
      };

      if (!locations)
        return result;

      if (locations.DE && !locations.DE.length) {
        result.germany = true;
        return result;
      }

      featured.forEach(function(entry) {
        var country = entry.value.country_iso;
        var city = entry.value.city;
        var index = (locations[country] || []).indexOf(city);

        entry.selected = index !== -1;
        if (entry.selected)
          locations[country].splice(index, 1);
      });

      result.list = Object.keys(locations).reduce(function(sum, country) {
        return sum.concat(locations[country].map(function(city) {
          return { city: city, country_iso: country };
        }));
      }, []);

      result.other = !!result.list.length;
      return result;
    }

    function addLocation(locations, entry) {
      if (!locations[entry.country_iso])
        locations[entry.country_iso] = [ entry.city ];
      else
        locations[entry.country_iso].push(entry.city);
    }
  });
});
