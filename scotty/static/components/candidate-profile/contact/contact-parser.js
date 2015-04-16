define(function(require) {
  'use strict';
  var _ = require('underscore');

  return {
    get: get,
    set: set,
  };


  function get(candidate) {
    return _.pick(candidate.getDataCached(),
      'contact_line1', 'contact_line2', 'contact_phone', 'contact_skype',
      'contact_zipcode', 'email', 'github_url', 'location', 'pob',
      'stackoverflow_url', 'blog_url');
  }

  function set(candidate, model) {
    if ('location' in model && !model.location)
      model = _.omit(model, 'location');

    return candidate.updateData(model).then(function() {
      return candidate.getSignupStage();
    });
  }
});
