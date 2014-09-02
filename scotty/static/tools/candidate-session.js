define(function(require) {
  'use strict';
  var module = require('app-module');
  module.factory('CandidateSession', function($http) {

    var CandidateSession = {
      user: null,
      login: login,
      logout: logout,
      register: register,
      checkSession: checkSession,
    };

    function login(email, password) {
      return $http.post('/api/v1/candidates/login', {
        email: email,
        pwd: password
      }).then(function(response) {
        CandidateSession.user = response.data;
        return response.data;
      });
    }

    function logout() {
      CandidateSession.user = null;
      document.cookie = false;
    }

    function register() {
      // TODO
    }

    function checkSession() {
      return $http.get('/api/v1/candidates/me').then(function(response) {
        CandidateSession.user = response.data;
        return response.data;
      });
    }

    return CandidateSession;
  });
});
