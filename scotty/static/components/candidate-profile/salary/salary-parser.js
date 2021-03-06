define(function() {
  'use strict';

  return {
    get: get,
    set: set,
  };


  function get(candidate) {
    var data = candidate.getDataCached();
    var target = candidate.getTargetPositionCached();

    return {
      locations: data && data.preferred_location,
      salary: target && target.minimum_salary,
      skills: target && target.skills,
    };
  }

  function set(candidate, model) {
    return Promise.all([
      candidate.setPreferredLocations(model.locations),
      candidate.setTargetPosition({
        minimum_salary: model.salary,
        skills: model.skills,
      }),
    ]).then(function() {
      return refresh(candidate);
    });
  }

  function refresh(candidate) {
    return Promise.all([
      candidate.getData(),
      candidate.getTargetPosition(),
      candidate.getSignupStage(),
    ]);
  }
});
