define(function(require) {
  'use strict';
  require('tools/api');


  function helper(key) {
    return function(options) {
      options = options || {};
      if (typeof options === 'string')
        options = { term: options };

      var params = {};
      if (options.limit)
        params.limit = options.limit;
      if (options.term)
        params.q = options.term;

      return this._api.get('/config/' + key, params).then(function(response) {
        return response.data;
      });
    };
  }


  function ConfigAPI(api) {
    this._api = api;
    this._locations = {};

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

    // search
    skills: helper('skills'),
    roles: helper('roles'),
    companies: helper('companies'),
    jobTitles: helper('job_titles'),
    institutions: helper('institutions'),
    languages: helper('languages'),
    courses: helper('courses'),
    locations: helper('locations'),

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
