define(function(require) {
  'use strict';
  require('components/element-connectors-buttons/element-connectors-buttons');
  var _ = require('underscore');
  var module = require('app-module');

  module.directive('hcTosLink', function() {
    return {
      restrict: 'E',
      transclude: true,
      template: '<a class="link" style="text-decoration: underline;" ' +
        'href="../en/terms-candidate.html" target="_blank" ng-transclude></a>',
    };
  });

  module.controller('CandidateSignupUserCtrl', function($scope, $q, $state, gettext, toaster,
                                                        Loader, ConfigAPI, Session) {
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
      if (!$scope.formSignupUser.$valid)return;
      var id = localStorage.getItem('scotty:user_id');
      $scope.loading = true;
      Loader.add('signup-user-saving');

      return Session.createUser(id, $scope.model).then(function(user) {
        localStorage.removeItem('scotty:user_id');
        if (importedData)
          return user.updateData(importedData);
      }).then(function() {
        return $scope.signup.nextStep();
      }).catch(function(request) {
        if (request.status === 409) {
          $scope.errorEmailAlreadyRegistered = true;
          return;
        }

        if (request.status === 400 && request.data.errors) {
          if(request.data.errors.invite_code === 'INVALID CHOICE')
            toaster.error(gettext('Unknown invite code'));
          else if(request.data.errors.email)
              $scope.formSignupUser.email.$setValidity('email', false);
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
