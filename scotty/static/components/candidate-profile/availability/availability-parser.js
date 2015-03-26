define(function() {
  'use strict';

  return {
    get: get,
    set: set,
  };


  function get(candidate) {
    var data = candidate.getDataCached();
    return data && data.availability;
  }

  function set(candidate, model) {
    return candidate.updateData({ availability: model });
  }
});
