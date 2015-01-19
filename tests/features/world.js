/*globals guid, ES6Promise */
'use strict';

if (typeof Promise === 'undefined')
  ES6Promise.polyfill();

function World() {
  this.vars = {};
}

(function() {
  var toString = Function.prototype.call.bind(Object.prototype.toString);
  var variableToken = /<%=\s*(\w+)\s*%>/;
  var privateKey = /^\$/;

  function isArray(value) {
    return toString(value) === '[object Array]';
  }

  function isObject(value) {
    return toString(value) === '[object Object]';
  }

  function equal(object, expected) {
    if (expected) {
      if (expected.$not)
        return !equal(object, expected.$not);
      else if (expected.$exist)
        return object !== undefined;
    }

    if (isArray(expected)) {
      if (!isArray(object)) return false;
      return expected.every(function(item) {
        return object.some(function(target) {
          return equal(target, item);
        });
      });

    } else if (isObject(expected)) {
      if (!isObject(object)) return false;
      return Object.keys(expected).every(function(key) {
        if (privateKey.test(key)) return;
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
      return 'catch+test-entity-' + this.guid() + '@hackandcraft.com';
    },

    json: function(string) {
      return JSON.parse(string);
    },

    setVars: function(string) {
      var match = string.match(variableToken);
      var token, variable;

      while (match) {
        token = match[0];
        variable = match[1];

        if (!(variable in this.vars))
          throw new Error('Undefined test variable: ' + variable);

        string = string.replace(token, this.vars[variable]);
        match = string.match(variableToken);
      }

      return string;
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
