define(function(require) {
  'use strict';
  require('tools/api');
  var fn = require('tools/fn');
  var Office = require('apps/common/offer');
  var Employer = require('apps/common/employer');
  var Candidate = require('apps/common/candidate');

  function AdminSession(api, promise, apikey) {
    this._api = api;
    this._promise = promise;
    this.getParams = '?apikey=' + apikey;
  }

  AdminSession.prototype = {
    constructor: AdminSession,

    getLoginAsEmployerLink: function(employer) {
      if (!employer) return '';
      return this._api.root() + '/admin/sudo/employer/' + employer.id + this.getParams +
        '&furl=' + document.location.origin + document.location.pathname + '../employer';
    },

    getLoginAsCandidateLink: function(candidate) {
      if (!candidate) return '';
      return this._api.root() + '/admin/sudo/candidate/' + candidate.id + this.getParams +
        '&furl=' + document.location.origin + document.location.pathname + '../candidate';
    },

    inviteEmployer: function(model) {
      return this._api.post('/admin/employers' + this.getParams, model);
    },

    approveEmployer: function(employer) {
      return this._api.get('/admin/employers/' + employer.id + '/approve' + this.getParams);
    },

    approveCandidate: function(candidate) {
      return this._api.get('/admin/candidates/' + candidate.id + '/approve' + this.getParams);
    },

    wakeCandidate: function(candidate) {
      return this._api.get('/admin/candidates/' + candidate.id + '/wake' + this.getParams);
    },

    getInvitedCandidates: function(code, options) {
      return this._api.get('/admin/invite_codes/' + code + '/candidates' + this.getParams, options).then(
        function(response) {
          response.data = response.data.map(function(data) {
            return new Candidate(this._api, data.id, data, this.getParams);
          }.bind(this));
          return response;
        }.bind(this));
    },

    getEmployersByStatus: function(status) {
      return this._api.get('/admin/employers/' + status + this.getParams).then(fn.get('data'));
    },

    getCandidatesByStatus: function(status) {
      return this._api.get('/candidates' + this.getParams + '&status=' + status).then(function(response) {
        return response.data.map(function(data) {
          return new Candidate(this._api, data.id, data, this.getParams);
        }.bind(this));
      }.bind(this));
    },

    getOffers: function() {
      return this._api.get('/admin/offers' + this.getParams).then(function(response) {
        return response.data.map(function(data) {
          return new Office(this._api, '/admin/offers/' + data.id, data, this.getParams);
        }.bind(this));
      }.bind(this));
    },

    getOffer: function(id) {
      var url = '/admin/offers/' + id;
      return this._api.get(url + this.getParams).then(function(response) {
        return new Office(this._api, url, response, this.getParams);
      }.bind(this));
    },

    searchEmployers: function(query) {
      return this._api.get('/admin/search/employers' + this.getParams, query);
    },

    getEmployer: function(id) {
      return this._api.get('/employers/' + id + this.getParams).then(function(data) {
        return new Employer(this._api, data.id, data, this.getParams);
      }.bind(this));
    },


    searchCandidates: function(query) {
      return this._api.get('/admin/search/candidates' + this.getParams, query).then(function(response) {
        response.data = response.data.map(function(data) {
          return new Candidate(this._api, data.id, data, this.getParams);
        }.bind(this));
        return response;
      }.bind(this));
    },

    getCandidate: function(id) {
      return this._api.get('/candidates/' + id + this.getParams).then(function(data) {
        return new Candidate(this._api, data.id, data, this.getParams);
      }.bind(this));
    },

    getInviteCodes: function() {
      return this._api.get('/admin/invite_codes' + this.getParams).then(function(response) {
        return response.data;
      });
    },

    addInviteCode: function(data) {
      return this._api.post('/admin/invite_codes' + this.getParams, data).then(function(response) {
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
  module.factory('Session', function(API, $q, $location) {
    var params = $location.search();
    if(!params.apikey) {
      var w = 'write';
      document[w]('ApiKey Invalid');
      document.close();
      throw new Error('ApiKey Invalid');
    }

    function promise(resolver) {
      var deferred = $q.defer();
      resolver(deferred.resolve, deferred.reject);
      return deferred.promise;
    }

    return new AdminSession(API, promise, params.apikey);
  });


  return AdminSession;
});
