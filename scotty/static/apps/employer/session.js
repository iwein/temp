define(function(require) {
  'use strict';
  require('tools/api');
  var throttlePromise = require('./tools/throttle-promise');
  var Employer = require('apps/common/employer');
  var Candidate = require('apps/common/candidate');


  function EmployerSession(api, i18n) {
    this._api = api;
    this._i18n = i18n;
    this._setUser = this._setUser.bind(this);

    var self = this;
    this._i18n.onChange(function(lang) {
      self.setLanguage(lang);
    });
  }

  EmployerSession.prototype = {
    constructor: EmployerSession,

    _setUser: function(response) {
      this.approved = response.status === 'APPROVED';
      this._unsetUser();
      this._i18n.setLanguage(response.locale);
      this.user = new Employer(this._api, 'me', response);
      this.isApproved = response.is_approved;
      this.isActivated = true;

      document.title = '4Scotty – ' + response.company_name;
      window.Raygun.setUser(response.id, false, response.email);

      if(window.UserVoice !== null && response.email && response.company_name){
        window.UserVoice.push(['identify', {
          email: response.email,
          name: response.company_name,
          id: response.id,
          type: 'employer'
        }]);
      }
      return this.user;
    },

    _unsetUser: function() {
      if (this.user)
        this.user.dispose();
      this.user = null;
      document.title = '4Scotty – Employer';
    },

    id: function() {
      return this.user && this.user.id;
    },

    getUser: throttlePromise(function() {
      return this._api.get('/employers/me')
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
      return this._api.post('/employers/login', {
        email: email,
        pwd: password,
      }).then(this._setUser);
    },

    logout: function() {
      return this._api.get('/employers/logout').then(function(response) {
        if (response.success)
          this._unsetUser();
      }.bind(this));
    },

    recoverPassword: function(params) {
      return this._api.post('/employers/requestpassword', params);
    },
    valdiateResetToken: function(token) {
      return this._api.get('/employers/resetpassword/' + token);
    },
    resetPassword: function(token, password) {
      return this._api.post('/employers/resetpassword/' + token, { pwd: password });
    },

    checkSession: function() {
      return this.getUser().then(function(user) { return !!user });
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
      return this.getSignupStage().then(function(resp){
        return resp.ordering.reduce(function(accumulated, key) {
          return accumulated && resp[key];
        }, true);
      });
    },

    getInvitationData: function(token) {
      return this._api.get('/employers/invite/' + token);
    },

    searchCandidates: function(query) {
      return this._api.get('/candidates', query).then(function(response) {
        response.data = response.data.map(function(data) {
          return new Candidate(this._api, data.id, data);
        }.bind(this));
        return response;
      }.bind(this));
    },


    searchCandidatesAdvanced: function(query) {
      var offset = query.offset ? '?offset=' + query.offset : '';
      return this._api.post('/candidates/advancedsearch' + offset, query).then(function(response) {
        response.data = response.data.map(function(data) {
          return new Candidate(this._api, data.id, data);
        }.bind(this));
        return response;
      }.bind(this));
    },

    getCandidate: function(id) {
      return this._api.get('/candidates/' + id).then(function(data) {
        return new Candidate(this._api, data.id, data);
      }.bind(this));
    }
  };

  var module = require('app-module');
  module.factory('Session', function(API, i18n) {
    var session = new EmployerSession(API, i18n);
    session.checkSession();
    return session;
  });


  return EmployerSession;
});
