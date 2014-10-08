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


  function ConfigAPI(api) {
    this._api = api;
    this._locations = {};
    this._lastResults = {};

    Object.keys(ConfigAPI.prototype).forEach(function(method) {
      if (method !== 'constructor')
        this[method] = this[method].bind(this);
    }, this);
  }

  ConfigAPI.prototype = {
    constructor: ConfigAPI,
    // no search
    degrees: helper('degrees'),
    companyTypes: helper('company_types'),
    skillLevels: helper('skill_levels'),
    proficiencies: helper('proficiencies'),
    benefits: helper('benefits'),
    rejectReasons: helper('rejectionreasons'),
    withdrawReasons: helper('withdrawalreasons'),
    travelWillingness: helper('travelwillingness'),
    salutations: helper('salutations'),
    featuredLanguages: helper('languages/featured'),

    // search
    skills: helper('skills'),
    roles: helper('roles'),
    companies: helper('companies'),
    institutions: helper('institutions'),
    languages: helper('languages'),
    courses: helper('courses'),
    countries: helper('countries'),
    locations: helper('locations'),

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
  module.factory('ConfigAPI', function(API) {
    return new ConfigAPI(API);
  });


  return ConfigAPI;
});
