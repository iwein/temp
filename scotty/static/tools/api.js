define(function(require) {
  'use strict';

  function API(ajax, options) {
    options = options || {};
    this._ajax = ajax;
    this._root = options.root || 'http://localhost/api/'
    this._version = options.version || 'v1';
  }

  API.prototype = {
    constructor: API,

    root: function() {
      return this._root + '/' + this._version + '/';
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
    }
  };


  var module = require('app-module');
  module.factory('API', function($http) {
    return new API($http);
  });


  return API;
});
