define(function(require) {
  'use strict';
  require('tools/api');

  function CandidateSession(api) {
    this._api = api;
  }

  CandidateSession.prototype = {
    constructor: CandidateSession,

    signup: function() {
      // TODO
    },

    login: function(email, password) {
      return this._api.post('/candidates/login', {
        email: email,
        pwd: password
      }).then(function(response) {
        this.user = response;
        return response;
      }.bind(this));
    },

    logout: function() {
      this.user = null;
      document.cookie = false;
      return this._api.get('/candidates/logout').then(function() {
        this.user = null;
        return null;
      }.bind(this));
    },

    checkSession: function() {
      return this._api.get('/candidates/me').then(function(response) {
        this.user = response;
        return response;
      }.bind(this), function(request) {
        if (request.status === 403)
          return null;
        throw request;
      });
    },

    hasSession: function() {
      return !!this.user;
    },
  };


  var module = require('app-module');
  module.factory('CandidateSession', function(API) {
    var session = new CandidateSession(API);
    session.checkSession();
    return session;
  });


  return CandidateSession;
});
