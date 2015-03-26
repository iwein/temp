define(function() {
  'use strict';

  return {
    get: get,
    set: set,
  };


  function get(candidate) {
    var data = candidate.getDataCached();
    return data && data.cv_upload_url;
  }

  function set(candidate, model) {
    return candidate.updateData({ cv_upload_url: model });
  }
});
