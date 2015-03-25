define(function(require) {
  'use strict';
  var module = require('app-module');

  module.directive('hcPreferredLocation', function(i18n) {
    return {
      restrict: 'EA',
      template: '{{ preferred_location }}',
      scope: {
        candidate: '=',
      },
      link: function(scope) {
        scope.$watch('candidate', function(candidate) {
          if (!candidate) return;
          var location = candidate._data.preferred_location;

          i18n.onChange(update);
          update();

          function update() {
            scope.preferred_location = parsePreferredLocations(location);
          }
        });
      }
    };

    function parsePreferredLocations(locations) {
      if (!locations) return i18n.gettext('Not specified');

      return Object.keys(locations).map(function(country) {
        var cities = locations[country];
        var text = cities.length ? cities.join(', ') : i18n.gettext('Anywhere');
        return text + ' ' + country;
      }).join(' - ');
    }
  });
});
