define(function(require) {
  'use strict';
  require('tools/api');


  function getHelper(key) {
    return function() {
      return this._api.get('/candidates/' + this.id() + '/' + key);
    };
  }
  function setHelper(key, method) {
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

    id: function() {
      return this.user && this.user.id;
    },

    activate: function(token) {
      return this._api.get('/candidates/activate/' + token);
    },

    signup: function(data) {
      return this._api.post('/candidates/', data).then(function(response) {
        this.user = response;
        return response.id;
      }.bind(this));
    },

    getSignupStage: function() {
      return this._api.get('/candidates/signup_stage').then(null, function(request) {
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
      this._onReady.finally(fn);
    },

    setProfile: function(model) {
      return this._api.post('/candidates/me/picture', { url: model.photo });
    },

    addTargetPosition: setHelper('target_positions', 'post'),
    getTargetPositions: getHelper('target_positions'),

    addExperience: setHelper('work_experience', 'post'),
    getExperience: getHelper('work_experience'),

    addEducation: setHelper('education', 'post'),
    getEducation: getHelper('education'),

    setPreferredCities: setHelper('preferred_cities', 'put'),
    setSkills: setHelper('skills', 'put'),
    setLanguages: setHelper('languages', 'put'),
    getUserData: function() {
      return this.checkSession();
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
