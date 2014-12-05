define(function(require) {
  'use strict';
  require('components/directive-candidate/directive-candidate');
  require('components/directive-offer/directive-offer');
  var fn = require('tools/fn');
  var module = require('app-module');


  // jshint maxparams:8
  module.controller('DashboardCtrl', function($scope, $q, $sce, toaster, Loader, ConfigAPI, Permission, Session) {
    this.searchSkills = ConfigAPI.skills;
    this.setLocation = setLocation;
    $scope.locationToText = ConfigAPI.locationToText;
    $scope.searchCities = ConfigAPI.locations;
    $scope.updateLocations = updateLocations;
    $scope.advancedSearch = advancedSearch;
    $scope.simpleSearch = simpleSearch;
    $scope.loadPage = loadPage;
    $scope.today = new Date();
    $scope.terms = {};
    $scope.ready = false;
    var resultsPerPage = 10;
    Loader.page(true);

    ConfigAPI.featuredRoles().then(fn.setTo('featuredRoles', $scope));

    Permission.requireSignup().then(function() {
      return Session.getUser();
    }).then(function(user) {
      return $q.all([
        user.getTimeline(),
        user.getOffers(),
        user.getSuggestedCandidates(),
        user.getCandidates(),
      ]);
    }).then(function(results) {
      $scope.ready = true;
      $scope.news = results[0];
      $scope.offers = results[1];
      $scope.suggested = results[2];
      $scope.candidates = results[3];

      $scope.candidates.forEach(function(candidate) {
        candidate.getLastPosition().then(fn.setTo('position', candidate));
      });

      $scope.offers.forEach(function(offer) {
        offer.setDataParser(function(data) {
          data.interview_details = $sce.trustAsHtml(data.interview_details);
          data.job_description = $sce.trustAsHtml(data.job_description);
        });
      });
    }).finally(function() {
      Loader.page(false);
    });


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

      if ($scope.anywhereInGermany)
        locations.DE = [];

      if ($scope.locationOther) {
        $scope.preferred_locations.forEach(add);
        $scope.errorLocationRequired = !Object.keys(locations).length;
      }
    }

    function setLocation(text) {
      $scope.location = ConfigAPI.getLocationFromText(text || $scope.locationText);
      search();
    }

    function loadPage(page) {
      $scope.searchCandidates = $scope.searchResults
        .slice(page * resultsPerPage, (page + 1) * resultsPerPage);
      $scope.page = page;
    }

    function advancedSearch() {
      var count = 0;
      var params = JSON.parse(JSON.stringify($scope.terms));
      Object.keys(params).forEach(function(key) {
        if (!params[key] || (Array.isArray(params[key]) && !params[key].length))
          delete params[key];
        else
          count++;
      });

      if (!count)
        return resetSearch();

      $scope.loading = true;
      return Session.searchCandidatesAdvanced(params)
        .then(search)
        .catch(toaster.defaultError)
        .finally(function() {
          $scope.loading = false;
        });
    }

    function simpleSearch() {
      if (!$scope.simpleSearchTerms)
        return resetSearch();

      $scope.loading = true;
      return Session.searchCandidates({ q: $scope.simpleSearchTerms })
        .then(search)
        .catch(toaster.defaultError)
        .finally(function() {
          $scope.loading = false;
        });
    }

    function resetSearch() {
      $scope.searchCandidates = [];
      $scope.searchResults = [];
      $scope.pages = [];
    }

    function search(candidates) {
      var pagesCount = candidates.length / resultsPerPage;
      var pages = [];

      for (var i = 0; i < pagesCount; i++)
        pages.push(i + 1);

      $scope.searchResults = candidates;
      $scope.pages = pages;
      loadPage(0);
    }
  });

  return {
    url: '/dashboard/',
    template: require('text!./employer-dashboard.html'),
    controller: 'DashboardCtrl',
    controllerAs: 'dashboard',
  };
});
