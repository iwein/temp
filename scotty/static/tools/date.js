define(function() {
  'use strict';

  function get(year, month, day, hours, minutes, seconds) {
    if (arguments.length === 2) return new Date(year, month);
    if (arguments.length === 3) return new Date(year, month, day);
    if (arguments.length === 4) return new Date(year, month, day, hours);
    if (arguments.length === 5) return new Date(year, month, day, hours, minutes);
    if (arguments.length === 6) return new Date(year, month, day, hours, minutes, seconds);
  }

  function now() {
    return new Date();
  }

  function epoch() {
    return new Date(0);
  }

  function parse(value) {
    return new Date(value.replace(/-/g, '/'));
  }

  function timestamp() {
    return Date.now();
  }

  function fromTimestamp(value) {
    return new Date(value);
  }

  return {
    get: get,
    now: now,
    epoch: epoch,
    parse: parse,
    timestamp: timestamp,
    fromTimestamp: fromTimestamp,
  };
});
