define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-candidate/directive-candidate');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');


  module.controller('SearchCtrl', function($scope, $q, toaster, ConfigAPI, Permission, Session) {
    this.searchLocations = ConfigAPI.locationsText;
    this.searchSkills = ConfigAPI.skills;
    this.setLocation = setLocation;
    this.search = search;
    $scope.terms = [];

    $scope.ready = false;
    Permission.requireActivated().then(function() {
      $scope.ready = true;
    });

    function setLocation(text) {
      $scope.location = ConfigAPI.getLocationFromText(text || $scope.locationText);
      search();
    }

    function search() {
      var tags = $scope.terms && $scope.terms.join();
      var params = _.extend({}, $scope.location, tags ? { tags: tags } : null);

      Session.searchCandidates(params).then(function(candidates) {
        return $q.all(candidates.map(fn.invoke('getData', [])));
      }).then(function(results) {
        $scope.candidates = results;
      }).catch(toaster.defaultError);
    }

  });


  return {
    url: '/search-candidates/',
    template: require('text!./employer-search-candidates.html'),
    controller: 'SearchCtrl',
    controllerAs: 'searchCandidates',
  };
});
