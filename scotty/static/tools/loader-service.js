define(function(require) {
  'use strict';

  function Loader(scope, key) {
    this.enabled = {};
    this.scope = scope;
    this.key = key;
    this._reduce = this._reduce.bind(this);
  }

  Loader.prototype = {
    constructor: Loader,

    _reduce: function(result, key) {
      return result || this.enabled[key];
    },

    add: function(id) {
      this.enabled[id] = true;
      this.scope[this.key] = true;
    },

    remove: function(id) {
      if (!this.enabled[id])
        return;

      this.enabled[id] = false;
      delete this.enabled[id];
      this.scope[this.key] = Object.keys(this.enabled).reduce(this._reduce, false);
    },

    clear: function() {
      this.enabled = {};
    },
  };


  var module = require('app-module');
  module.service('Loader', function($rootScope) {
    var loader = new Loader($rootScope, 'showSpinner');
    loader.page = function(state) {
      loader[state ? 'add' : 'remove']('page-loading');
    };
    return loader;
  });


  return Loader;
});
