define(function(require) {
  'use strict';
  require('tools/api');


  function EmployerSession(api) {
    this._api = api;
    this.checkSession = this.checkSession.bind(this);
  }

  EmployerSession.prototype = {
    constructor: EmployerSession,

    login: function(email, password) {
      return this._api.post('/employers/login', {
        email: email,
        pwd: password,
      }).then(this.checkSession);
    },

    logout: function() {
      return this._api.get('/employers/logout').then(function(data) {
        if (data.success)
          this.user = null;
      }.bind(this));
    },

    signup: function(data) {
      return this._api.post('/employers/', data).then(this.checkSession);
    },

    signupInvited: function(token, password) {
      return this._api.post('/employers/invite/' + token, { pwd: password })
        .then(this.checkSession);
    },

    updateData: function(data) {
      return this._api.put('/employers/me', data).then(this.checkSession);
    },

    apply: function(data) {
      return this._api.put('/employers/me/apply', data).then(this.checkSession);
    },

    listOffices: function() {
      return this._api.get('/employers/me/offices');
    },

    addOffice: function(data) {
      return this._api.post('/employers/me/offices', data);
    },

    removeOffice: function(data) {
      return this._api.delete('/employers/me/offices/' + data.id);
    },

    getSignupStage: function() {
      return this._api.get('/employers/me/signup_stage').then(null, function(request) {
        if (request.status === 403 || request.status === 404)
          return null;
        throw request;
      });
    },

    checkSession: function() {
      return this._api.get('/employers/me').then(function(response) {
        this.user = response;
        return response;
      }.bind(this), function(request) {
        if (request.status === 403 || request.status === 404)
          return null;
        throw request;
      });
    },

    hasSession: function() {
      return !!this.user;
    },

    getUserData: function() {
      return this.checkSession();
    },

    getInvitationData: function(token) {
      return this._api.get('/employers/invite/' + token);
    },

    getSuggestedCandidates: function() {
      return this._api.get('/employers/me/suggestedcandidates');
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
