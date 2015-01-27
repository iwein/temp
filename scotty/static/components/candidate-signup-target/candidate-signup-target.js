define(function(require) {
  'use strict';
  require('tools/config-api');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');


  module.controller('CandidateSignupTargetCtrl', function($scope, $q, toaster, Loader, ConfigAPI) {
    _.extend($scope, {
      locationToText: ConfigAPI.locationToText,
      searchCities: ConfigAPI.locations,
      onFeaturedSkillChange: onFeaturedSkillChange,
      updateLocations: updateLocations,
      searchSkills: searchSkills,
      submit: submit,
      model: { preferred_locations: {} },
      preferred_locations: [],
      flags: {},
      anywhereInGermany: false,
      ready: false,
    });


    return onLoad();


    function onLoad() {
      return $q.all([
        ConfigAPI.featuredRoles().then(fn.setTo('featuredRoles', $scope)),
        ConfigAPI.featuredSkills().then(toCheckboxModel.bind(null, 'featuredSkills')),
        ConfigAPI.featuredLocations().then(toCheckboxModel.bind(null, 'featuredLocations')),
      ]).then(function() {
        var stored = localStorage.getItem('scotty:target_position');
        if (stored)
          setModel(stored ? JSON.parse(stored) : {});
      }).finally(function() {
        toaster.show('alert banner-message',
            '<h2>Sign up as IT professional and get hired!</h2>'+
            'If you are an employer, click <a href="../employer/#/signup"><b>here</b></a>!',
          {html: true, untilStateChange: true});

        Loader.page(false);
        $scope.ready = true;
      });

      function toCheckboxModel(key, data) {
        $scope[key] = data.map(function(type) { return { value: type } });
      }
    }

    function onFeaturedSkillChange() {
      $scope.form.skill.$dirty = true;
      $scope.skillSelected = $scope.featuredSkills.some(fn.get('selected'));
      $scope.model.featuredSkills = $scope.featuredSkills
        .filter(fn.get('selected'))
        .map(fn.get('value'));
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

    function setModel(model) {
      model = $scope.model = JSON.parse(JSON.stringify(model));
      setPreferredLocations(model.preferred_locations || {});

      // Skills parsing
      var skills = model.skills || [];
      $scope.featuredSkills.forEach(function(item) {
        item.selected = skills.indexOf(item.value) !== -1;
      });
      $scope.skillSelected = $scope.featuredSkills.some(fn.get('selected'));
    }

    function submit() {
      updateLocations($scope.anywhereInGermany);
      if (!$scope.form.$valid || $scope.errorLocationRequired)
        return;

      var model = $scope.model;
      localStorage.setItem('scotty:target_position', JSON.stringify(model));
      $scope.signup.target = _.omit(model, 'preferred_locations');
      $scope.signup.preferred_locations = model.preferred_locations;

      $scope.loading = true;
      Loader.add('signup-target-saving');

      $scope.signup.nextStep().finally(function() {
        $scope.loading = false;
        Loader.remove('signup-target-saving');
      });
    }

    function updateLocations(anywhereInGermany) {
      var locations = {};
      var someLocation = false;
      $scope.errorLocationRequired = false;
      $scope.model.preferred_locations = locations;

      $scope.featuredLocations
        .filter(fn.get('selected'))
        .map(fn.get('value'))
        .forEach(add);

      if (anywhereInGermany)
        locations.DE = [];

      if ($scope.flags.locationOther)
        $scope.preferred_locations.forEach(add);

      $scope.errorLocationRequired = !someLocation;

      function add(entry) {
        someLocation = true;
        if (!locations[entry.country_iso])
          locations[entry.country_iso] = [ entry.city ];
        else
          locations[entry.country_iso].push(entry.city);
      }
    }

    function setPreferredLocations(locations) {
      // Anywhere in germany parsing
      var germany = locations.DE;
      $scope.anywhereInGermany = germany && germany.length === 0;
      $scope.preferred_locations = [];
      if ($scope.anywhereInGermany) {
        $scope.featuredLocations.forEach(fn.set('selected', false));
        $scope.locationOther = false;
        return;
      }

      // Featured locations
      $scope.featuredLocations.forEach(function(entry) {
        var country = entry.value.country_iso;
        var city = entry.value.city;
        var index = (locations[country] || []).indexOf(city);
        entry.selected = index !== -1;
        if (entry.selected)
          locations[country].splice(index, 1);
      });

      // Other locations
      var countries = Object.keys(locations);
      var citiesCount = countries.reduce(function(total, entry) {
        return total + locations[entry].length;
      }, 0);
      $scope.locationOther = citiesCount !== 0;

      countries.forEach(function(country) {
        locations[country].forEach(function(city) {
          $scope.preferred_locations.push({
            country_iso: country,
            city: city,
          });
        });
      });
    }
  });

  return {
    url: '/target-position/',
    template: require('text!./candidate-signup-target.html'),
    controller: 'CandidateSignupTargetCtrl',
    controllerAs: 'signupTarget'
  };
});
