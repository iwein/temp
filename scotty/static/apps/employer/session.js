define(function(require) {
  'use strict';
  require('tools/api');


  function EmployerSession(api, promise) {
    this._api = api;
    this._promise = promise;
  }

  EmployerSession.prototype = {
    constructor: EmployerSession,

    login: function() { //(email, password) {
      return this._promise(function(resolve, reject) {
        reject('NOT_IMPLEMENTED');
      });
    },

    signup: function() {
      return this._promise(function(resolve, reject) {
        reject('NOT_IMPLEMENTED');
      });
    },

    isSignupComplete: function() {
      return this._promise(function(resolve) {
        resolve(false);
      });
    },

    getInvitationData: function() {
      return this._promise(function(resolve) {
        resolve({
          contact_name: 'Rigoberta Menchu',
          company_name: 'General Motors',
          email: 'rmenchu@generalmotors.com',
        });
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

    var session = new EmployerSession(API, promise);
    //session.checkSession();
    return session;
  });


  return EmployerSession;
});
