/*globals guid, ES6Promise */
'use strict';

if (typeof Promise === 'undefined')
  ES6Promise.polyfill();

function World() {
  this.vars = {};
}

(function() {
  var toString = Function.prototype.call.bind(Object.prototype.toString);
  var privateKey = /^\$/;

  function isArray(value) {
    return toString(value) === '[object Array]';
  }

  function isObject(value) {
    return toString(value) === '[object Object]';
  }

  function equal(vars, object, expected, negated) {
    if (expected) {
      if (expected.$not && !negated)
        return !equal(vars, object, expected, true);
      else if (expected.$exist)
        return object !== undefined;
      else if (expected.$value) {
        if (!(expected.$value in vars))
          throw new Error('Undefined test variable: ' + expected.$value);
        expected = vars[expected.$value];
      }
    }

    if (isArray(expected)) {
      if (!isArray(object)) return false;
      return expected.every(function(item) {
        return object.some(function(target) {
          return equal(vars, target, item);
        });
      });

    } else if (isObject(expected)) {
      if (!isObject(object)) return false;
      return Object.keys(expected).every(function(key) {
        if (privateKey.test(key)) return;
        return equal(vars, object[key], expected[key]);
      });

    } else {
      return expected === object;
    }
  }


  World.prototype = {
    guid: guid,
    isArray: isArray,
    isObject: isObject,
    equal: function(object, expected) {
      return equal(this.vars, object, expected);
    },

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
