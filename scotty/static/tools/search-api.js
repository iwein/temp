define(function(require) {
  'use strict';
  require('tools/api');


  function searchHelper(key) {
    return function(term, limit) {
      return this._api.get('/config/' + key, {
        limit: limit || 10,
        q: term,
      }).then(function(response) {
        return response.data;
      });
    };
  }

  var searchLocations = searchHelper('locations');


  function SearchAPI(api) {
    this._api = api;
    this._locations = {};

    Object.keys(SearchAPI.prototype).forEach(function(method) {
      if (method !== 'constructor')
        this[method] = this[method].bind(this);
    }, this);
  }

  SearchAPI.prototype = {
    constructor: SearchAPI,
    skills: searchHelper('skills'),
    roles: searchHelper('roles'),
    companies: searchHelper('companies'),
    jobTitles: searchHelper('job_titles'),

    locations: function(term, limit) {
      return searchLocations.call(this, term, limit).then(function(locations) {
        var texts = locations.map(this.locationToText);

        texts.forEach(function(text, index) {
          this._locations[text] = locations[index];
        }, this);

        return texts;
      }.bind(this));
    },

    locationToText: function(entry) {
      return entry.city + ', ' + entry.country_iso;
    },

    getLocationFromText: function(text) {
      return this._locations[text] || null;
    }
  };


  var module = require('app-module');
  module.factory('SearchAPI', function(API) {
    return new SearchAPI(API);
  });


  return SearchAPI;
});
