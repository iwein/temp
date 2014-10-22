/*globals guid */

function World() { }

World.prototype = {
  generateEmail: function() {
    return 'catch+candidate-' + guid() + '@hackandcraft.com';
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
};
