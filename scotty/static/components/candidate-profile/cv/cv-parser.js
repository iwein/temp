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

  function set(candidate, Amazon, model) {
    return Amazon.upload(model, 'cv', candidate.id).then(function(url) {
      return candidate.updateData({ cv_upload_url: url });
    }).then(function() {
      return candidate.getSignupStage();
    });
  }
});
