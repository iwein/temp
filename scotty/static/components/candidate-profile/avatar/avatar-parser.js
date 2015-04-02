define(function(require) {
  'use strict';
  var Date = require('tools/date');

  return {
    get: get,
    set: set,
  };


  function get(candidate) {
    var data = candidate.getDataCached();
    return data && data.picture_url;
  }

  function set(candidate, Amazon, file) {
    return Amazon.upload(file, 'users', candidate.id).then(function(url) {
      return candidate.setPhoto(url + '?nocache=' + Date.timestamp());
    }).then(function() {
      return refresh(candidate);
    });
  }

  function refresh(candidate) {
    return candidate.getData();
  }
});
