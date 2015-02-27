define(function(require) {
  'use strict';
  var apiURL = require('conf').api_url;

  function API(ajax, when, options) {
    options = options || {};
    this.when = when;
    this._ajax = ajax;
    this._root = options.root || apiURL;
    this._version = options.version || 'v1';
  }

  API.prototype = {
    constructor: API,

    root: function() {
      return this._root + this._version;
    },

    get: function(url, params) {
      return this._ajax.get(this.root() + url, {
        params: params,
      }).then(function(response) {
        return response.data;
      });
    },

    post: function(url, data) {
      return this._ajax.post(this.root() + url, data).then(function(response) {
        return response.data;
      });
    },

    put: function(url, data) {
      return this._ajax.put(this.root() + url, data).then(function(response) {
        return response.data;
      });
    },

    delete: function(url, data) {
      return this._ajax.delete(this.root() + url, {
        data: data
      }).then(function(response) {
        return response.data;
      });
    }
  };


  var module = require('app-module');
  module.factory('API', function($http, $q) {
    return new API($http, $q.when);
  });


  return API;
});
