define(function(require) {
  'use strict';
  require('components/element-connectors-buttons/element-connectors-buttons');
  var _ = require('underscore');
  var module = require('app-module');

  module.controller('CandidateSignupUserCtrl', function($scope, $q, $state, toaster, Loader, ConfigAPI, Session) {
    this.onEmailChange = onEmailChange;
    this.submit = submit;
    $scope.loading = false;
    $scope.model = {};
    $scope.errorEmailAlreadyRegistered = false;
    Loader.page(true);
    var importedData;

    Session.getConnectors().getData().then(function(data) {
      if (data)
        setDataFromNetworks(data);
    }).finally(function() {
      Loader.page(false);
    });


    function setDataFromNetworks(data) {
      $scope.imported = true;
      _.extend($scope.model, _.pick(data, 'first_name', 'last_name', 'email'));
      importedData = _.pick(data, 'dob', 'picture_url');

      var city = data.contact_city;
      var country = data.contact_country_iso;
      if (!city || !country)
        return;

      return ConfigAPI.isValidCity(city, country).then(function(isValid) {
        if (isValid) {
          importedData.location = {
            country_iso: data.contact_country_iso,
            city: data.contact_city,
          };
        }
      });
    }

    function onEmailChange() {
      $scope.errorEmailAlreadyRegistered = false;
    }

    function submit() {
      $scope.loading = true;
      Loader.add('signup-user-saving');

      return Session.signup($scope.model).then(function() {
        var position = _.omit($scope.signup.target, 'preferred_locations', 'featuredSkills');
        var locations = $scope.signup.preferred_locations;
        position.skills = [].concat(position.skills || [], $scope.signup.target.featuredSkills || []);

        return $q.all([
          importedData ? Session.user.updateData(importedData) : null,
          Session.user.setTargetPosition(position),
          Session.user.setPreferredLocations(locations),
        ]);
      }).then(function() {
        localStorage.removeItem('scotty:target_position');
        return $scope.signup.nextStep();
      }).catch(function(request) {
        if (request.status === 409) {
          $scope.errorEmailAlreadyRegistered = true;
          return;
        }

        if (request.status === 400 && request.data.db_message === 'Unknown InviteCode') {
          toaster.error('Unknown invite code');
          return;
        }

        throw request;
      }).catch(function() {
        toaster.defaultError();
      }).finally(function() {
        $scope.loading = false;
        Loader.remove('signup-user-saving');
      });
    }
  });

  return {
    url: '/user/',
    template: require('text!./candidate-signup-user.html'),
    controller: 'CandidateSignupUserCtrl',
    controllerAs: 'signupUser',
  };
});
