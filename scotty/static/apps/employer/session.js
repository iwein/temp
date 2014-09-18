define(function(require) {
  'use strict';
  require('tools/api');
  var Employer = require('apps/common/employer');
  var Candidate = require('apps/common/candidate');


  function EmployerSession(api) {
    this._api = api;
    this._setUser = this._setUser.bind(this);
  }

  EmployerSession.prototype = {
    constructor: EmployerSession,

    _setUser: function(response) {
      if (this.user)
        this.user.dispose();

      this.user = new Employer(this._api, 'me', response);
      return this.user;
    },

    id: function() {
      return this.user && this.user.id;
    },

    login: function(email, password) {
      return this._api.post('/employers/login', {
        email: email,
        pwd: password,
      }).then(this._setUser);
    },

    logout: function() {
      return this._api.get('/employers/logout').then(function(response) {
        if (!response.success) return;
        this.user.dispose();
        this.user = null;
      }.bind(this));
    },

    checkSession: function() {
      return this._api.get('/employers/me')
        .then(this._setUser)
        .then(function() { return true })
        .catch(function(request) {
          if (request.status === 403)
            return false;
          throw request;
        });
    },

    signup: function(data) {
      return this._api.post('/employers/', data).then(this._setUser);
    },

    signupInvited: function(token, password) {
      return this._api.post('/employers/invite/' + token, { pwd: password })
        .then(this._setUser);
    },

    getSignupStage: function() {
      return this._api.get('/employers/me/signup_stage').catch(function(request) {
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
      return this.checkSession().then(function(result) {
        return result && this.user.getData().then(function(data) {
          return data.status === 'APPROVED';
        });
      }.bind(this));
    },

    getInvitationData: function(token) {
      return this._api.get('/employers/invite/' + token);
    },

    searchCandidates: function(tags) {
      return this._api.get('/candidates', { tags: tags.join() }).then(function(response) {
        return response.map(function(data) {
          return new Candidate(this._api, data.id, data);
        }.bind(this));
      }.bind(this));
    },

    getCandidate: function(id) {
      return this._api.get('/candidates/' + id).then(function(data) {
        return new Candidate(this._api, data.id, data);
      }.bind(this));
    },
  };

  var module = require('app-module');
  module.factory('Session', function(API) {
    var session = new EmployerSession(API);
    session.checkSession();
    return session;
  });


  return EmployerSession;
});
