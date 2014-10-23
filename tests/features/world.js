/*globals guid */
'use strict';

function World() { }

World.prototype = {
  guid: guid,

  generateEmail: function() {
    return 'catch+candidate-' + this.guid() + '@hackandcraft.com';
  },

  storeRequest: function(promise) {
    var self = this;
    this.lastRequest = null;
    this.lastResponse = null;

    function listener(request) {
      self.lastRequest = request;
      self.lastResponse = request.responseJSON || null;
    }

    return promise.then(listener, listener);
  },

  tableToObject: function(table) {
    var values = table.raw();
    var result = {};

    for (var i = 0; i < values.length; i++)
      result[values[i][0]] = values[i][1];

    return result;
  }
};
