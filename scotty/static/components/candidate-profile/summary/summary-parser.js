define(function() {
  'use strict';

  return {
    get: get,
    set: set,
  };


  function get(candidate) {
    var data = candidate.getDataCached();
    return data && data.summary;
  }

  function set(candidate, model) {
    return candidate.updateData({ summary: model }).then(function() {
      return candidate.getSignupStage();
    });
  }
});
