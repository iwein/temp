define(function() {
  'use strict';

  function LinkedInConnector(api) {
    this._api = api;
    this._connectUrl = api.root() + '/connect/linkedin?furl=';
    this.checkConnection();
  }

  LinkedInConnector.prototype = {
    constructor: LinkedInConnector,

    _getData: function() {
      return this._api.get('/connect/linkedin/me');
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
          window.location = this._connectUrl + encodeURIComponent(window.location.toString() + 'import');
      }.bind(this));
    },

    getData: function() {
      return this.connect().then(function() {
        return this._getData();
      }.bind(this));
    },

    getProfileData: function() {
      return this.connect().then(function() {
        return this._api.get('/i-will-fail');
      }.bind(this));
    },

    getExperience: function() {
      return this.connect().then(function() {
        return this._api.get('/connect/linkedin/work_experience');
      }.bind(this));
    },

    getEducation: function() {
      return this.connect().then(function() {
        return this._api.get('/connect/linkedin/education');
      }.bind(this));
    },
  };

  return LinkedInConnector;
});
