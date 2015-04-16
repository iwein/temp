define(function() {
  'use strict';

  return {
    get: get,
    set: set,
  };


  function get(candidate) {
    var data = candidate.getDataCached();
    return data && data.skills;
  }

  function set(candidate, model) {
    return candidate.setSkills(model).then(function() {
      return Promise.all([
        candidate.getData(),
        candidate.getSignupStage(),
      ]);
    });
  }
});
