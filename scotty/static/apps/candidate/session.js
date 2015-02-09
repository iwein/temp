define(function(require) {
  'use strict';
  require('tools/api');
  var _ = require('underscore');
  var throttlePromise = require('tools/throttle-promise');
  var ConnectorsManager = require('apps/candidate/connectors-manager');
  var Candidate = require('apps/common/candidate');
  var Employer = require('apps/common/employer');


  function CandidateSession(api, i18n, Q) {
    this._Q = Q;
    this._api = api;
    this._i18n = i18n;
    this._setUser = this._setUser.bind(this);

    var self = this;
    this._i18n.onChange(function(lang) {
      self.setLanguage(lang);
    });
  }

  CandidateSession.prototype = {
    constructor: CandidateSession,

    _setUser: function(response) {
      this._unsetUser();
      this._i18n.setLanguage(response.locale);
      this.user = new Candidate(this._api, 'me', response);
      this.isActivated = this.isActivated || response.is_activated;
      this.isApproved = response.is_approved;
      var fullName = response.first_name + ' ' + response.last_name;
      document.title = '4Scotty – ' + fullName;
      if (window.UserVoice && response.email) {
        window.UserVoice.push(['identify', {
          email: response.email,
          name: fullName,
          id: response.id,
          type: 'candidate'
        }]);
      }
      return this.user;
    },

    _unsetUser: function() {
      if (this.user)
        this.user.dispose();
      this.user = null;
      document.title = '4Scotty – Candidate';
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

    setLanguage: function(lang) {
      if (this.user)
        this.user.updateData({ locale: lang });
    },

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

    resendActivation: function(params) {
      return this._api.post('/candidates/me/resendactivation', params);
    },
    recoverPassword: function(params) {
      return this._api.post('/candidates/requestpassword', params);
    },
    resendPassword: function(params) {
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
      return this._api.post('/candidates/', data).then(function(response) {
        return response.id;
      });
    },

    createUser: function(id, data) {
      return this._api.post('/candidates/' + id, data).then(this._setUser);
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
      return this._api.get('/employers/', query);
    },
    getEmployer: function(id) {
      return this._api.get('/employers/' + id).then(function(data) {
        return new Employer(this._api, data.id, data);
      }.bind(this));
    },

    getConnectors: _.memoize(function() {
      return new ConnectorsManager(this._api, this._Q);
    }),
  };

  var module = require('app-module');
  module.factory('Session', function(API, i18n, $q) {
    var session = new CandidateSession(API, i18n, $q);
    session.checkSession();
    return session;
  });


  return CandidateSession;
});
