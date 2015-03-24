define(function() {
  'use strict';

  return {
    throttle: throttlePromise,
    cacheMethods: replaceMethods,
    cacheMethod: replaceMethod,
    syncVersion: getSyncVersion,
  };


  function throttlePromise(operation) {
    var promise = null;

    return function() {
      if (!promise) {
        promise = operation.apply(this, arguments)
          .finally(function() { promise = null });
      }

      return promise;
    };
  }

  function replaceMethods(object, methods) {
    if (Array.isArray(methods)) {
      return methods.forEach(function(value) {
        replaceMethod(object, value);
      });
    }

    Object.keys(methods).forEach(function(key) {
      replaceMethod(object, key, methods[key]);
    });
  }

  function replaceMethod(object, method, cachedName) {
    cachedName = cachedName || (method + 'Cached');
    var original = object[method];
    var functions = getSyncVersion(original);

    object[cachedName] = functions.cached;
    object[method] = functions.substitute;
    object[method].original = original;
    object[method].restore = restore;

    function restore() {
      object[method] = original;
    }
  }

  function getSyncVersion(fn) {
    var cache;

    return {
      substitute: substitute,
      cached: cached,
    };

    function substitute() {
      // jshint validthis:true
      return fn.apply(this, arguments).then(function(value) {
        cache = value;
        return value;
      });
    }

    function cached() {
      return cache;
    }
  }
});
