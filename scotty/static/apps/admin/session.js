define(function(require) {
  'use strict';
  require('tools/api');
  var fn = require('tools/fn');
  var Office = require('apps/common/offer');
  var Employer = require('apps/common/employer');
  var Candidate = require('apps/common/candidate');
  var apiKey = 'apikey=6b23dd93c33e4100ce9332eff5df6e7b01e5a289681cdff';
  var getParams = '?' + apiKey;

  function AdminSession(api, promise) {
    this._api = api;
    this._promise = promise;
  }

  AdminSession.prototype = {
    constructor: AdminSession,

    inviteEmployer: function(model) {
      return this._api.post('/admin/employers' + getParams, model);
    },

    approveEmployer: function(employer) {
      return this._api.get('/admin/employers/' + employer.id + '/approve' + getParams);
    },

    approveCandidate: function(candidate) {
      return this._api.get('/admin/candidates/' + candidate.id + '/approve' + getParams);
    },

    getEmployersByStatus: function(status) {
      return this._api.get('/admin/employers/' + status + getParams).then(fn.get('data'));
    },

    getCandidatesByStatus: function(status) {
      return this._api.get('/candidates' + getParams + '&status=' + status).then(fn.get('data'));
    },

    getOffers: function() {
      return this._api.get('/admin/offers' + getParams).then(function(response) {
        return response.data.map(function(data) {
          return new Office(this._api, '/admin/offers/' + data.id, data);
        }.bind(this));
      }.bind(this));
    },

    getOffer: function(id) {
      var url = '/admin/offers/' + id;
      return this._api.get(url + getParams).then(function(response) {
        return new Office(this._api, url, response);
      }.bind(this));
    },

    searchEmployers: function(query) {
      return this._api.get('/admin/search/employers' + getParams, query);
    },

    getEmployer: function(id) {
      return this._api.get('/employers/' + id + getParams).then(function(data) {
        return new Employer(this._api, data.id, data);
      }.bind(this));
    },


    searchCandidates: function(query) {
      return this._api.get('/admin/search/candidates' + getParams, query).then(function(response) {
        response.data = response.data.map(function(data) {
          return new Candidate(this._api, data.id, data);
        }.bind(this));
        return response;
      }.bind(this));
    },

    getCandidate: function(id) {
      return this._api.get('/candidates/' + id + getParams).then(function(data) {
        return new Candidate(this._api, data.id, data);
      }.bind(this));
    },

    getInviteCodes: function() {
      return this._api.get('/admin/invite_codes' + getParams).then(function(response) {
        return response.data;
      });
    },

    addInviteCode: function(data) {
      return this._api.post('/admin/invite_codes', data + getParams).then(function(response) {
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
