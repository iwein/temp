define(function(require) {
  'use strict';
  require('tools/api');


  function getHelper(key) {
    return function(limit) {
      var config = {};
      if (limit)
        config.limit = limit;

      return this._api.get('/config/' + key, config).then(function(response) {
        return response.data;
      });
    };
  }


  function ListAPI(api) {
    this._api = api;

    Object.keys(ListAPI.prototype).forEach(function(method) {
      if (method !== 'constructor')
        this[method] = this[method].bind(this);
    }, this);
  }

  ListAPI.prototype = {
    constructor: ListAPI,
    degrees: getHelper('degrees'),
    companyTypes: getHelper('company_types'),
    skillLevels: getHelper('skill_levels'),
  };


  var module = require('app-module');
  module.factory('ListAPI', function(API) {
    return new ListAPI(API);
  });


  return ListAPI;
});
