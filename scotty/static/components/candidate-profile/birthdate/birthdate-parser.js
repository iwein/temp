define(function() {
  'use strict';

  return {
    get: get,
    set: set,
  };


  function get(candidate) {
    var data = candidate.getDataCached();
    return {
      dob: data && data.dob,
      eu_work_visa: data && data.eu_work_visa,
    };
  }

  function set(candidate, model) {
    return candidate.updateData(model);
  }
});
