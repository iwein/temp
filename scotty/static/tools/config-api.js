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

  function translated(key) {
    var retrieve = cached(key);
    return function() {
      var tr = this._tr;
      return retrieve.call(this).then(function(response) {
        return response.map(tr);
      });
    };
  }


  function ConfigAPI(api, tr) {
    this._tr = tr;
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

    // translate
    benefits: translated('benefits'),
    salutations: translated('salutations'),
    companyTypes: translated('company_types'),
    skillLevels: translated('skill_levels'),
    proficiencies: translated('proficiencies'),
    rejectReasons: translated('rejectionreasons'),
    withdrawReasons: translated('withdrawalreasons'),
    featuredRoles: translated('roles/featured'),

    // no search
    degrees: cached('degrees'),
    travelWillingness: cached('travelwillingness'),
    featuredLanguages: cached('languages/featured'),
    featuredSkills: cached('skills/featured'),
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
  module.factory('ConfigAPI', function(API, gettext) {
    return new ConfigAPI(API, gettext);
  });


  return ConfigAPI;
});
