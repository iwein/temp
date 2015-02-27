define(function(require) {
  'use strict';
  require('tools/api');
  var _ = require('underscore');

  function helper(key) {
    var url = '/config/' + key;
    request.url = url;

    // This function will be a method so we can use 'this' here
    //jshint -W040
    function request(options) {
      options = typeof options === 'string' ?
        { q: options } :
        _.extend({}, options);

      return this._api.get(url, options).then(function(response) {
        this._lastResults[key] = response.data;
        return response.data;
      }.bind(this));
    }

    return request;
  }

  function cached(key) {
    var url = '/config/' + key;
    wrapper.url = url;

    // This function will be a method so we can use 'this' here
    //jshint -W040
    function wrapper() {
      if (!this._promises[key])
        this._promises[key] = this._api.get(url).then(function(response) { return response.data });
      return this._promises[key];
    }

    return wrapper;
  }


  function ConfigAPI(api) {
    this._api = api;
    this._locations = {};
    this._lastResults = {};
    this._promises = {};

    Object.keys(ConfigAPI.prototype).forEach(function(method) {
      if (method !== 'constructor')
        this[method] = this[method].bind(this);
    }, this);
  }

  ConfigAPI.prototype = {
    constructor: ConfigAPI,

    // no search
    benefits: cached('benefits'),
    salutations: cached('salutations'),
    companyTypes: cached('company_types'),
    skillLevels: cached('skill_levels'),
    proficiencies: cached('proficiencies'),
    rejectReasons: cached('rejectionreasons'),
    withdrawReasons: cached('withdrawalreasons'),
    featuredRoles: cached('roles/featured'),
    degrees: cached('degrees'),
    locales: cached('locales'),
    travelWillingness: cached('travelwillingness'),
    featuredSkills: cached('skills/featured'),
    featuredLanguages: cached('languages/featured'),
    featuredLocations: cached('locations/featured'),

    // search
    skills: helper('skills'),
    roles: helper('roles'),
    companies: helper('companies'),
    institutions: helper('institutions'),
    languages: helper('languages'),
    courses: helper('courses'),
    countries: helper('countries'),
    locations: helper('locations'),

    isValidCity: function(city, country_iso) {
      return this.locations({
        limit: 1,
        q: city,
        country_iso: country_iso,
      }).then(function(response) {
        return !!response.length;
      });
    },

    isValidLanguage: function(lang) {
      var langs = this._lastResults.languages;
      return langs && langs.indexOf(lang) !== -1;
    },

    // custom
    locationsText: function(options) {
      return this.locations(options).then(function(locations) {
        var texts = locations.map(this.locationToText);

        texts.forEach(function(text, index) {
          this._locations[text.toLowerCase()] = locations[index];
        }, this);

        return texts;
      }.bind(this));
    },

    locationToText: function(entry) {
      return entry.city + ', ' + entry.country_iso;
    },

    getLocationFromText: function(text) {
      return this._locations[text.toLowerCase()] || null;
    }
  };


  var module = require('app-module');
  module.factory('ConfigAPI', function(API) {
    return new ConfigAPI(API);
  });


  return ConfigAPI;
});
