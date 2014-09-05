define(function(require) {
  'use strict';
  require('tools/api');


  function setHelper(method, key) {
    return function(data) {
      return this._api[method]('/candidates/' + this.id() + '/' + key, data);
    };
  }


  function CandidateSession(api) {
    this._api = api;
    this.ready = false;
    this._onReady = null;
  }

  CandidateSession.prototype = {
    constructor: CandidateSession,

    signup: function(data) {
      return this._api.post('/candidates/', data).then(function(response) {
        this.user = response;
        return response.id;
      }.bind(this));
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
      var checking = this._api.get('/candidates/me').then(function(response) {
        this.user = response;
        return response;
      }.bind(this), function(request) {
        if (request.status === 403)
          return null;
        throw request;
      });

      this._onReady = checking;
      this.whenReady(function() {
        this.ready = true;
      }.bind(this));

      return checking;
    },

    hasSession: function() {
      return !!this.user;
    },

    whenReady: function(fn) {
      this._onReady.then(fn, fn);
    },

    id: function() {
      return this.user && this.user.id;
    },

    addTargetPosition: setHelper('post', 'target_positions'),
    setPreferredCities: setHelper('put', 'preferred_cities'),
    addExperience: setHelper('post', 'work_experience'),
    addEducation: setHelper('post', 'education'),
    setSkills: setHelper('put', 'skills'),
    setLanguages: setHelper('put', 'languages'),
  };

  var module = require('app-module');
  module.factory('CandidateSession', function(API) {
    var session = new CandidateSession(API);
    session.checkSession();
    return session;
  });


  return CandidateSession;
});
