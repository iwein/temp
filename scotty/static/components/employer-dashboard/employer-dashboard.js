define(function(require) {
  'use strict';
  require('components/directive-candidate/directive-candidate');
  require('components/directive-offer/directive-offer');
  require('components/element-preferred-location/element-preferred-location');
  require('components/partial-employer-newsitem/partial-employer-newsitem');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var Date = require('tools/date');
  var module = require('app-module');


  // jshint maxparams:8
  module.controller('DashboardCtrl', function($scope, $q, $sce, toaster, Loader, ConfigAPI, RequireSignup, Session) {
    _.extend($scope, {
      locationToText: ConfigAPI.locationToText,
      searchCities: ConfigAPI.locations,
      searchSkills: ConfigAPI.skills,
      updateLocations: updateLocations,
      isAdvancedSearch: isAdvancedSearch,
      setAdvancedSearch: setAdvancedSearch,
      rejectRequest: rejectRequest,
      notInterested: notInterested,
      removeSearch: removeSearch,
      saveSearch: saveSearch,
      loadSearch: loadSearch,
      search: executeSearch,
      onKeyDown: onKeyDown,
      today: Date.now(),
      resultsPerPage: 10,
      terms: {},
      flags: {},
      ready: false,
    });
    var advancedSearch = true;

    return onLoad();


    function onLoad() {
      Loader.page(true);
      ConfigAPI.featuredRoles().then(fn.setTo('featuredRoles', $scope));

      return Session.getUser().then(function(user) {
        return $q.all([
          user.getTimeline().then(fn.setTo('news', $scope)),
          user.getOffers('active').then(fn.setTo('offers', $scope)),
          user.getSearches().then(fn.setTo('searches', $scope)),
          user.getRelevantCandidates()
            .then(fn.get('data'))
            .then(fn.setTo('relevant', $scope)),
          user.getCandidates().then(fn.setTo('candidates', $scope)),
          user.getSuggestedCandidates({ limit: 3 }).then(function(response) {
            $scope.suggested = response.data;
          }),
        ]);
      }).then(function() {
        $scope.ready = true;

        $scope.offers.forEach(function(offer) {
          offer.setDataParser(function(data) {
            data.interview_details = $sce.trustAsHtml(data.interview_details);
            data.job_description = $sce.trustAsHtml(data.job_description);
          });
        });

        return $q.all($scope.candidates.map(function(candidate) {
          return candidate.getLastPosition().then(fn.setTo('position', candidate));
        }));
      }).finally(function() {
        Loader.page(false);
      });
    }

    function saveSearch(name) {
      var data = {
        name: name,
        advanced: isAdvancedSearch(),
        terms: isAdvancedSearch() ? $scope.terms : { q: $scope.simpleSearchTerms },
      };
      $scope.flags.showSaveForm = false;
      $scope.saveSearchName = '';

      return Session.getUser().then(function(user) {
        return user.addSearch(data).then(function() {
          return user.getSearches();
        });
      }).then(fn.setTo('searches', $scope));
    }

    function removeSearch(search) {
      return Session.getUser().then(function(user) {
        return user.removeSearch(search).then(function() {
          return user.getSearches();
        });
      }).then(fn.setTo('searches', $scope));
    }

    function loadSearch(search) {
      setAdvancedSearch(search.advanced);

      if (isAdvancedSearch())
        $scope.terms = search.terms;
      else
        $scope.simpleSearchTerms = search.terms.q;

      executeSearch();
    }

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

    function isAdvancedSearch() {
      return advancedSearch;
    }

    function setAdvancedSearch(value) {
      advancedSearch = value;
    }

    function resetSearch() {
      $scope.totalResults = null;
      $scope.searchCandidates = [];
      $scope.searchResults = [];
      $scope.pages = [];
    }

    function getSearchParams() {
      if (isAdvancedSearch())
        return JSON.parse(JSON.stringify($scope.terms));

      var terms = $scope.simpleSearchTerms;
      return terms ? { q: terms } : {};
    }

    function executeSearch(pagination) {
      var params = getSearchParams();
      if (isEmpty(params))
        return resetSearch();

      _.extend(params, pagination);
      $scope.loading = true;
      Loader.add('candidate-search');

      var method = isAdvancedSearch() ? 'searchCandidatesAdvanced' : 'searchCandidates';
      return Session[method](params).then(function(response) {
        $scope.totalResults = response.pagination.total;
        $scope.searchResults = response.data;
      }).catch(function(error) {
        toaster.defaultError(error);
        throw error;
      }).finally(function() {
        Loader.remove('candidate-search');
        $scope.loading = false;
      });
    }

    function isEmpty(value) {
      var count = 0;
      Object.keys(value).forEach(function(key) {
        if (!value[key] || (Array.isArray(value[key]) && !value[key].length))
          delete value[key];
        else
          count++;
      });
      return !count;
    }

    function onKeyDown(event) {
      if (event.keyCode === 13)
        executeSearch();
    }

    function rejectRequest(candidate, index) {
      return Session.getUser().then(function(user) {
        return user.rejectRequest(candidate);
      }).then(function() {
        $scope.candidates.splice(index, 1);
      });
    }

    function notInterested(suggestion, index) {
      return Session.getUser().then(function(user) {
        return user.notInterested(suggestion);
      }).then(function() {
        $scope.suggested.splice(index, 1);
      })
      .catch(toaster.defaultError);
    }
  });

  return {
    url: '/dashboard/',
    template: require('text!./employer-dashboard.html'),
    controller: 'DashboardCtrl',
    resolve: {
      /*@ngInject*/
      RequireSignup: function(Permission) {
        return Permission.requireSignup();
      }
    }
  };
});
