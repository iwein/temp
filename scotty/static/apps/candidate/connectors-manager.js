define(function(require) {
  'use strict';
  var GenericConnector = require('apps/candidate/generic-connector');


  function getValues(method) {
    return function() {
      var Promise = this._promise;

      return this.getConnected().then(function(connectors) {
        return Promise.all(connectors.map(function(connector) {
          return connector[method]();
        })).then(function(result) {
          return result.filter(Boolean)[0] || null;
        });
      });
    };
  }


  function ConnectorsManager(api, Promise) {
    this._promise = Promise;
    this._map = {};
    this._connectors = [
      this._map.linkedin = new GenericConnector(api, 'linkedin'),
      this._map.xing = new GenericConnector(api, 'xing'),
    ];
  }

  ConnectorsManager.prototype = {
    constructor: ConnectorsManager,

    getAsMap: function() {
      return this._map;
    },

    getConnected: function() {
      var Promise = this._promise;
      var connectors = this._connectors;

      return Promise.all(connectors.map(function(connector) {
        return 'isConnected' in connector ?
          connector.isConnected :
          connector.checkConnection();
      })).then(function(result) {
        return result.map(function(isConnected, index) {
          if (isConnected)
            return connectors[index];
        }).filter(Boolean);
      });
    },

    getData: getValues('getData'),
    getEducation: getValues('getEducation'),
    getExperience: getValues('getExperience'),
  };

  return ConnectorsManager;
});
