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
    var index = value.indexOf('T');
    if (index !== -1)
      value = value.substr(0, index);

    return new Date(value.replace(/-/g, '/'));
  }

  function toUtcDate(date) {
    var copy = new Date(+date);
    var offset = copy.getTimezoneOffset() / 60;
    copy.setHours(-offset);
    return copy;
  }

  function toStringDate(date) {
    if (!date) return '';
    return date.toISOString().split('T')[0];
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
    toUtcDate: toUtcDate,
    toStringDate: toStringDate,
    timestamp: timestamp,
    fromTimestamp: fromTimestamp,
  };
});
