define(function(require) {
  'use strict';
  require('tools/api');
  var throttlePromise = require('./tools/throttle-promise');
  var LinkedInConnector = require('apps/candidate/linked-in-connector');
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
      this.isActivated = this.user._data.is_activated;
      this.isApproved= this.user._data.is_approved;
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

    refreshUser: function(){
      this.user = null;
      return this.getUser();
    },

    getUser: throttlePromise(function() {
      if (this.user)
        return this._api.when(this.user);
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

    recoverPassword: function(params) {
      return this._api.post('/candidates/requestpassword', params);
    },
    valdiateResetToken: function(token) {
      return this._api.get('/candidates/resetpassword/' + token);
    },
    resetPassword: function(token, password) {
      return this._api.post('/candidates/resetpassword/' + token, { pwd: password });
    },

    checkSession: function() {
      return this.getUser().then(function(user) { return !!user });
    },

    activate: function(token) {
      return this._api.get('/candidates/activate/' + token).then(function(){
        this.isActivated = true;
      }.bind(this));

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

    getCompletionWorkflow: function() {
      return this._api.get('/candidates/me/profile_completion');
    },

    getCompletionStage: function() {
      return this.getCompletionWorkflow().then(function(stage) {
        return stage.ordering.reduce(function(value, item) {
          if (value) return value;
          return stage[item] ? null : item;
        }, null);
      });
    },

    isSignupComplete: function() {
      return this.getSignupStage().then(function(resp){
        return resp.ordering.reduce(function(accumulated, key) {
          return accumulated && resp[key];
        }, true);
      });
    },

    searchEmployers: function(query) {
      return this._api.get('/employers/', query).then(function(response) {
        return response.data.map(function(data) {
          return new Employer(this._api, data.id, data);
        }.bind(this));
      }.bind(this));
    },
    getEmployer: function(id) {
      return this._api.get('/employers/' + id).then(function(data) {
        return new Employer(this._api, data.id, data);
      }.bind(this));
    },

    getLinkedIn: function() {
      var value = new LinkedInConnector(this._api);
      this.getLinkedIn = function() { return value };
      return value;
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
