define(function(require) {
  'use strict';
  var _ = require('underscore');

  return {
    get: get,
    set: set,
  };


  function get(candidate) {
    return _.pick(candidate.getDataCached(), 'first_name', 'last_name');
  }

  function set(candidate, model) {
    return candidate.updateData(model);
  }
});
