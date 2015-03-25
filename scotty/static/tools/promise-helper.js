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
    var substitute = functions.substitute;

    substitute.original = original;
    substitute.restore = restore;
    substitute.setCache = functions.setCache;
    object[cachedName] = functions.cached;
    object[method] = substitute;
    object.$revision = 0;

    function restore() {
      object[method] = original;
    }
  }

  function getSyncVersion(fn) {
    var cache;

    return {
      substitute: substitute,
      setCache: setCache,
      cached: cached,
    };

    function substitute() {
      // jshint validthis:true
      return fn.apply(this, arguments).then(setCache.bind(this));
    }

    function cached() {
      return cache;
    }

    function setCache(value) {
      // jshint validthis:true
      this.$revision++;
      cache = value;
      return value;
    }
  }
});
