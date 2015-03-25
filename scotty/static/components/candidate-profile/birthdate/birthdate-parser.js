define(function() {
  'use strict';

  return {
    get: get,
    set: set,
  };


  function get(candidate) {
    var data = candidate.getDataCached();
    return {
      dob: data && data.dob && Date.parse(data.dob),
      eu_work_visa: data && data.eu_work_visa,
    };
  }

  function set(candidate, model) {
    var offset = model.dob.getTimezoneOffset() / 60;
    model.dob.setHours(-offset);
    return candidate.updateData(model);
  }
});
