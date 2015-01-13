/*globals guid, ES6Promise */
'use strict';

if (typeof Promise === 'undefined')
  ES6Promise.polyfill();

function World() { }

(function() {

  function isArray(value) {
    return Object.prototype.toString.call(value) === '[object Array]';
  }

  function isObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
  }

  function equal(object, expected) {
    if (isArray(expected)) {
      if (!isArray(object)) return false;
      return expected.every(function(item, index) {
        return equal(object[index], item);
      });

    } else if (isObject(expected)) {
      if (!isObject(object)) return false;
      return Object.keys(expected).every(function(key) {
        return equal(object[key], expected[key]);
      });

    } else {
      return expected === object;
    }
  }


  World.prototype = {
    guid: guid,
    isArray: isArray,
    isObject: isObject,
    equal: equal,

    generateEmail: function() {
      return 'catch+candidate-' + this.guid() + '@hackandcraft.com';
    },

    json: function(string) {
      return JSON.parse(string);
    },

    storeRequest: function(promise) {
      var self = this;
      this.lastRequest = null;
      this.lastResponse = null;

      function listener(request) {
        self.lastRequest = request;
        self.lastResponse = request.responseJSON || null;
        return self.lastResponse;
      }

      return promise.then(listener, listener);
    },

    forEach: function(table, iterator, scope) {
      var iterable = table.raw ? table.raw() : table;
      for (var i = 0; i < iterable.length; i++)
        iterator.call(scope, iterable[i], i, iterable);
    },
  };

})();
