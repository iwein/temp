define(function(require) {
  'use strict';
  require('tools/api');
  var fn = require('tools/fn');
  var Office = require('apps/common/offer');


  function AdminSession(api, promise) {
    this._api = api;
    this._promise = promise;
  }

  AdminSession.prototype = {
    constructor: AdminSession,

    inviteEmployer: function(model) {
      return this._api.post('/admin/employers', model);
    },

    approveEmployer: function(employer) {
      return this._api.get('/admin/employers/' + employer.id + '/approve');
    },

    getEmployersByStatus: function(status) {
      return this._api.get('/admin/employers/' + status).then(fn.get('data'));
    },

    getOffers: function() {
      return this._api.get('/admin/offers').then(function(response) {
        return response.data.map(function(data) {
          return new Office(this._api, '/admin/offers', data);
        }.bind(this));
      }.bind(this));
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
