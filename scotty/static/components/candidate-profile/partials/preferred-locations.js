define(function(require) {
  'use strict';
  require('tools/label-typeahead-directive/label-typeahead-directive');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');


  module.directive('hcPreferredLocations', function(ConfigAPI) {
    var featuredLocations;
    var featuredPromise = ConfigAPI.featuredLocations().then(function(response) {
      featuredLocations = response;
    });


    return {
      template: require('text!./preferred-locations.html'),
      scope: {
        model: '=',
      },
      link: function(scope) {
        _.extend(scope, {
          locationToText: ConfigAPI.locationToText,
          searchCities: ConfigAPI.locations,
          updateLocations: updateLocations,
        });

        featuredPromise.then(update);
        scope.$watch('model', update);


        function update() {
          if (scope.model)
            _.extend(scope, parseLocations(scope.model));
        }

        function updateLocations() {
          var locations = {};
          var add = addLocation.bind(null, locations);
          scope.errorLocationRequired = false;

          if (scope.other) {
            scope.list.forEach(add);
            scope.errorLocationRequired = !Object.keys(locations).length;
          }

          scope.featured
            .filter(fn.get('selected'))
            .map(fn.get('value'))
            .forEach(add);

          if (scope.germany)
            locations.DE = [];

          scope.model = scope.errorLocationRequired ? null : locations;
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
