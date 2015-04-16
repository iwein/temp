define(function() {
  'use strict';

  return {
    get: get,
    set: set,
  };


  function get(candidate) {
    var data = candidate.getTargetPositionCached();
    return data && data.role;
  }

  function set(candidate, model) {
    return candidate.setTargetPosition({ role: model }).then(function() {
      return Promise.all([
        candidate.getTargetPosition(),
        candidate.getSignupStage(),
      ]);
    });
  }
});
