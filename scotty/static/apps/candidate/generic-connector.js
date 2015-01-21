define(function(require) {
  'use strict';
  var _ = require('underscore');
  var throttlePromise = require('tools/throttle-promise');

  // Calculates the space closest to the middle of the name
  function splitName(name) {
    var middle = name.length / 2;
    var spaces = [];
    var last = name.indexOf(' ');

    while(last !== -1) {
      spaces.push(last);
      last = name.indexOf(' ', last + 1);
    }

    if (!spaces.length) {
      return {
        first_name: name,
        last_name: '',
      };
    }

    var splitAt = spaces.reduce(function(current, position) {
      var better = Math.abs(current - middle);
      var distance = Math.abs(position - middle);
      return distance < better ? position : current;
    }, name.length);

    return {
      first_name: name.substr(0, splitAt),
      last_name: name.substr(splitAt + 1),
    };
  }



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

    getData: function() {
      return this.connect().then(function() {
        return this._getData().then(function(data) {
          var name = splitName(data.name);
          return _.extend(name, _.pick(data, 'email', 'network', 'picture'));
        });
      }.bind(this));
    },

    getProfileData: function() {
      return this.connect().then(function() {
        return this._api.get('/connect/' + this._key + '/profile');
      }.bind(this));
    },

    getExperience: function() {
      return this.connect().then(function() {
        return this._api.get('/connect/' + this._key + '/work_experience');
      }.bind(this));
    },

    getEducation: function() {
      return this.connect().then(function() {
        return this._api.get('/connect/' + this._key + '/education');
      }.bind(this));
    },
  };

  return GenericConnector;
});
