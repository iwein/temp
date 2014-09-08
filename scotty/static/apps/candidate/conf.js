define(function(require) {
  'use strict';
  var config = require('text!config/app-conf-dev.json');
  return JSON.parse(config);
});
