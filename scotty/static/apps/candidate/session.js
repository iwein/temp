define(function(require) {
  'use strict';
  require('tools/api');
  var throttlePromise = require('./tools/throttle-promise');
  var Candidate = require('apps/common/candidate');
  var Employer = require('apps/common/employer');


  function CandidateSession(api) {
    this._api = api;
    this._setUser = this._setUser.bind(this);
  }

  CandidateSession.prototype = {
    constructor: CandidateSession,

    _setUser: function(response) {
      this._unsetUser();
      this.user = new Candidate(this._api, 'me', response);
      return this.user;
    },

    _unsetUser: function() {
      if (this.user)
        this.user.dispose();
      this.user = null;
    },

    id: function() {
      return this.user && this.user.id;
    },

    getUser: throttlePromise(function() {
      return this._api.get('/candidates/me')
        .then(this._setUser)
        .catch(function(request) {
          if (request.status === 403) {
            this._unsetUser();
            return null;
          }
          throw request;
        }.bind(this));
    }),

    login: function(email, password) {
      return this._api.post('/candidates/login', {
        email: email,
        pwd: password
      }).then(this._setUser);
    },

    logout: function() {
      return this._api.get('/candidates/logout').then(function(response) {
        if (response.success)
          this._unsetUser();
      }.bind(this));
    },

    checkSession: function() {
      return this.getUser().then(function(user) { return !!user });
    },

    activate: function(token) {
      return this._api.get('/candidates/activate/' + token);
    },

    signup: function(data) {
      return this._api.post('/candidates/', data).then(this._setUser);
    },

    getSignupStage: function() {
      return this._api.get('/candidates/me/signup_stage').catch(function(request) {
        if (request.status === 403)
          return null;
        throw request;
      });
    },

    isSignupComplete: function() {
      return this.getSignupStage().then(function(stage) {
        if (!stage)
          return false;

        return stage.ordering.every(function(item) {
          return stage[item];
        });
      });
    },

    isActivated: function() {
      return this.isSignupComplete();
    },

    searchEmployers: function(tags) {
      return this._api.get('/employers', { tags: tags.join() }).then(function(response) {
        return response.map(function(data) {
          return new Employer(this._api, data.id, data);
        }.bind(this));
      }.bind(this));
    },
    getEmployer: function(id) {
      return this._api.get('/employers/' + id).then(function(data) {
        return new Employer(this._api, data.id, data);
      }.bind(this));
    },
  };

  var module = require('app-module');
  module.factory('Session', function(API) {
    var session = new CandidateSession(API);
    session.checkSession();
    return session;
  });


  return CandidateSession;
});
