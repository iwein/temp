define(function(require) {
  'use strict';
  require('tools/config-api');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');


  module.controller('CandidateSignupTargetCtrl', function($scope, $q, toaster, i18n, Loader, ConfigAPI, Session) {
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
      ]).finally(function() {


        // HACK: we have to do this in order to have a live translation & register the token
        // It's critical that `message` and `.gettext` argument have EXACTLY the same content.
        var message = '<h2>Sign up as IT professional and get hired!</h2>' +
            'If you are an employer, click <a href="/employer/#/signup"><b>here</b></a>!';
        i18n.gettext('<h2>Sign up as IT professional and get hired!</h2>' +
            'If you are an employer, click <a href="/employer/#/signup"><b>here</b></a>!');

        toaster.show('alert banner-message', '<translate>' + message + '</translate>', {
          html: true,
          untilStateChange: true
        });


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

    function submit() {
      updateLocations($scope.anywhereInGermany);
      if (!$scope.form.$valid || $scope.errorLocationRequired)
        return;

      $scope.loading = true;
      Loader.add('signup-target-saving');

      var preferred_locations = $scope.model.preferred_locations;
      var target_position = _.omit($scope.model, 'preferred_locations', 'featuredSkills');
      target_position.skills = (target_position.skills || []).concat($scope.model.featuredSkills || []);

      Session.getUser().then(function(user) {
        return $q.all([
          user.setTargetPosition(target_position),
          user.setPreferredLocations(preferred_locations),
        ]);
      }).then(function() {
        return $scope.signup.nextStep();
      }).catch(function(request) {
        if (request.status === 400 && request.data.errors) {
          if(request.data.errors['target_position.minimum_salary'])
              $scope.form.salary.$setValidity('max', false);
        } else throw request;
      }).finally(function() {
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

      $scope.errorLocationRequired = !someLocation && !anywhereInGermany;

      function add(entry) {
        someLocation = true;
        if (!locations[entry.country_iso])
          locations[entry.country_iso] = [ entry.city ];
        else
          locations[entry.country_iso].push(entry.city);
      }
    }
  });

  return {
    url: '/target-position/',
    template: require('text!./candidate-signup-target.html'),
    controller: 'CandidateSignupTargetCtrl',
    controllerAs: 'signupTarget'
  };
});
