define(function() {
  'use strict';

  function setTo(key, object, value) {
    object[key] = value;
    return value;
  }

  function set(key, value, object) {
    object[key] = value;
    return value;
  }

  function get(key, object) {
    return object[key];
  }

  function invoke(key, args, object) {
    return object[key].apply(object, args);
  }

  function curry(fn, length) {
    length = length || fn.length;
    return function currified() {
      var args = [].slice.call(arguments);

      if (args.length === 0)
        return currified;

      if (args.length >= length)
        return fn.apply(this, args);

      var child = fn.bind.apply(fn, [this].concat(args));
      return curry(child, length - args.length);
    };
  }

  return {
    setTo: curry(setTo),
    set: curry(set),
    get: curry(get),
    invoke: curry(invoke),
    curry: curry,
  };
});
