define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-employer/directive-employer');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');


  // jshint maxparams:7
  module.controller('SearchCtrl', function($scope, $q, toaster, Loader, ConfigAPI, Permission, Session) {
    this.searchLocations = ConfigAPI.locationsText;
    this.searchSkills = ConfigAPI.skills;
    this.setLocation = setLocation;
    this.search = search;
    $scope.terms = [];
    $scope.ready = false;
    $scope.loading = false;
    Loader.page(true);

    Permission.requireActivated().then(function() {
      $scope.ready = true;
      Loader.page(false);
    });

    ConfigAPI.companyTypes().then(function(data) {
      $scope.companyTypes = data.map(function(type) {
        return { value: type };
      });
    });

    function setLocation(text) {
      $scope.location = ConfigAPI.getLocationFromText(text || $scope.locationText);
      search();
    }

    function search() {
      var tags = $scope.terms && $scope.terms.join();
      var companyTypes = $scope.companyTypes
        .filter(fn.get('selected'))
        .map(fn.get('value'))
        .join();

      var params = _.extend({},
        $scope.location,
        tags && { tags: tags },
        companyTypes && { company_types: companyTypes }
      );

      $scope.loading = true;
      return Session.searchEmployers(params)
        .then(function(employers) {
          return $q.all(employers.map(fn.invoke('getData', [])));
        })
        .then(function(results) { $scope.employers = results })
        .catch(toaster.defaultError)
        .finally(function() {
          $scope.loading = false;
        });
    }
  });


  return {
    url: '/search-employers/',
    template: require('text!./candidate-search-employers.html'),
    controller: 'SearchCtrl',
    controllerAs: 'searchEmployers',
  };
});
