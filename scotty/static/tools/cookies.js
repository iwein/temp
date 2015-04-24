define(function() {
  'use strict';

  function getAll() {
    return document.cookie
      .split(/; ?/)
      .reduce(function(result, entry) {
        var index = entry.indexOf('=');
        var key = entry.substr(0, index);
        var value = entry.substr(index + 1);
        result[key] = value;
        return result;
      }, {});
  }

  function get(key) {
    return getAll()[key] || null;
  }

  function set(key, value, config) {
    config = config || {};
    var append = '';

    if (config.path)
      append += '; path=' + config.path;

    document.cookie = key + '=' + value + append;
  }

  function remove(path, key) {
    document.cookie = key + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }

  return {
    getAll: getAll,
    get: get,
    set: set,
    remove: remove,
  };
});
