define(function(require) {
  'use strict';
  require('tools/api');


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
      return this._api.get('/admin/employers/' + status).then(function(response) {
        return response.data;
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
