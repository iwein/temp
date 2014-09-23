define(function() {
  'use strict';

  return function throttlePromise(operation) {
    var promise = null;

    return function() {
      if (!promise) {
        promise = operation.apply(this, arguments)
          .finally(function() { promise = null });
      }

      return promise;
    };
  };
});
