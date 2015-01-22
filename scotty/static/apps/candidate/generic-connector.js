define(function(require) {
  'use strict';
  var _ = require('underscore');
  var throttlePromise = require('tools/throttle-promise');


  function GenericConnector(api, key) {
    this._key = key;
    this._api = api;
    this._connectUrl = api.root() + '/connect/' + key + '?furl=';
    this._getData = throttlePromise(this._getData);
  }

  GenericConnector.prototype = {
    constructor: GenericConnector,

    _getData: function() {
      return this._api.get('/connect/' + this._key + '/me');
    },

    checkConnection: function() {
      return this._getData().then(function() {
        return true;
      }).catch(function(request) {
        if (request.status === 403)
          return false;
      }).then(function(value) {
        this.isConnected = value;
        return value;
      }.bind(this));
    },

    connect: function() {
      return this.checkConnection().then(function(connected) {
        if (!connected)
          window.location = this._connectUrl + encodeURIComponent(window.location.toString());
      }.bind(this));
    },

    disconnect: function() {
      return this._api.get('/connect/' + this._key + '/forget');
    },

    getData: function() {
      return this._getData().then(function(data) {
        return _.pick(data, 'email', 'network', 'picture');
      });
    },

    getProfileData: function() {
      return this._api.get('/connect/' + this._key + '/profile');
    },

    getExperience: function() {
      return this._api.get('/connect/' + this._key + '/work_experience').then(function(response) {
        return response.filter(function(entry) { return !!entry.start });
      });
    },

    getEducation: function() {
      return this._api.get('/connect/' + this._key + '/education').then(function(response) {
        return response.filter(function(entry) { return !!entry.start });
      });
    },

    getProfile: function() {
      return this._api.get('/connect/' + this._key + '/profile');
    }
  };

  return GenericConnector;
});
