define(function(require) {
  'use strict';
  var moment = require('moment');
  var module = require('app-module');

  module.filter('timeAgo', function () {
    return function (value) {
      return value ? moment.utc(value).fromNow() : '';
    };
  });
});
