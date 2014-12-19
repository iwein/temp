define(function(require) {
  'use strict';
  require('tools/api');
  var fn = require('tools/fn');
  var Office = require('apps/common/offer');
  var Employer = require('apps/common/employer');
  var Candidate = require('apps/common/candidate');
  var apiKey = require('conf').admin_key;
  var getParams = '?apikey=' + apiKey;

  function AdminSession(api, promise) {
    this._api = api;
    this._promise = promise;
  }

  AdminSession.prototype = {
    constructor: AdminSession,

    getLoginAsEmployerLink: function(employer) {
      if (!employer) return '';
      return this._api.root() + '/admin/sudo/employer/' + employer.id + getParams +
        '&furl=' + document.location.origin + document.location.pathname + '../employer';
    },

    getLoginAsCandidateLink: function(candidate) {
      if (!candidate) return '';
      return this._api.root() + '/admin/sudo/candidate/' + candidate.id + getParams +
        '&furl=' + document.location.origin + document.location.pathname + '../candidate';
    },

    inviteEmployer: function(model) {
      return this._api.post('/admin/employers' + getParams, model);
    },

    approveEmployer: function(employer) {
      return this._api.get('/admin/employers/' + employer.id + '/approve' + getParams);
    },

    approveCandidate: function(candidate) {
      return this._api.get('/admin/candidates/' + candidate.id + '/approve' + getParams);
    },

    wakeCandidate: function(candidate) {
      return this._api.get('/admin/candidates/' + candidate.id + '/wake' + getParams);
    },

    getInvitedCandidates: function(code, options) {
      return this._api.get('/admin/invite_codes/' + code + '/candidates' + getParams, options).then(function(response) {
        response.data = response.data.map(function(data) {
          return new Candidate(this._api, data.id, data, getParams);
        }.bind(this));
        return response;
      }.bind(this));
    },

    getEmployersByStatus: function(status) {
      return this._api.get('/admin/employers/' + status + getParams).then(fn.get('data'));
    },

    getCandidatesByStatus: function(status) {
      return this._api.get('/candidates' + getParams + '&status=' + status).then(function(response) {
        return response.data.map(function(data) {
          return new Candidate(this._api, data.id, data, getParams);
        }.bind(this));
      }.bind(this));
    },

    getOffers: function() {
      return this._api.get('/admin/offers' + getParams).then(function(response) {
        return response.data.map(function(data) {
          return new Office(this._api, '/admin/offers/' + data.id, data, getParams);
        }.bind(this));
      }.bind(this));
    },

    getOffer: function(id) {
      var url = '/admin/offers/' + id;
      return this._api.get(url + getParams).then(function(response) {
        return new Office(this._api, url, response, getParams);
      }.bind(this));
    },

    searchEmployers: function(query) {
      return this._api.get('/admin/search/employers' + getParams, query);
    },

    getEmployer: function(id) {
      return this._api.get('/employers/' + id + getParams).then(function(data) {
        return new Employer(this._api, data.id, data, getParams);
      }.bind(this));
    },


    searchCandidates: function(query) {
      return this._api.get('/admin/search/candidates' + getParams, query).then(function(response) {
        response.data = response.data.map(function(data) {
          return new Candidate(this._api, data.id, data, getParams);
        }.bind(this));
        return response;
      }.bind(this));
    },

    getCandidate: function(id) {
      return this._api.get('/candidates/' + id + getParams).then(function(data) {
        return new Candidate(this._api, data.id, data, getParams);
      }.bind(this));
    },

    getInviteCodes: function() {
      return this._api.get('/admin/invite_codes' + getParams).then(function(response) {
        return response.data;
      });
    },

    addInviteCode: function(data) {
      return this._api.post('/admin/invite_codes' + getParams, data).then(function(response) {
        if (response.db_message === 'Code already created!')
          throw new Error('DUPLICATED_ENTRY');
        return response;
      }, function(request) {
        if (request.status === 409)
          throw new Error('DUPLICATED_ENTRY');
        throw request;
      });
    },
  };


  var module = require('app-module');
  module.factory('Session', function(API, $q) {

    function promise(resolver) {
      var deferred = $q.defer();
      resolver(deferred.resolve, deferred.reject);
      return deferred.promise;
    }

    return new AdminSession(API, promise);
  });


  return AdminSession;
});
