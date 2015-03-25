define(function() {
  'use strict';

  return {
    get: get,
    set: set,
  };


  function get(candidate) {
    var data = candidate.getDataCached();
    return data && data.languages.slice();
  }

  function set(candidate, model) {
    return candidate.setLanguages(model).then(function() {
      return candidate.getData();
    });
  }
});
