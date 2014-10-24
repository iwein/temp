define(function(require) {
  'use strict';
  var moment = require('moment');
  var module = require('app-module');

  module.filter('timeAgo', function() {
    return function (value) {
      return value ? moment.utc(value).fromNow() : '';
    };
  });

  module.filter('yearsAgo', function() {
    return function(value) {
      var date = new Date(value);
      var now = new Date();
      var zero = new Date(0);
      var diff = new Date(now - date);
      var year = diff.getFullYear();
      var baseYear = zero.getFullYear();
      return year - baseYear;
    };
  });

  module.filter('displayMonths', function() {
    return function(value) {
      var start = moment(typeof value.start === 'number' ? [value.start] : value.start);
      var end = moment(value.end && (typeof value.end === 'number' ? [value.end] : value.end));
      var diff = end.diff(start);
      var total = diff / 1000 / 60 / 60 / 24 / 30;
      var years = Math.floor(total / 12);
      var months = Math.round(total % 12);
      var result = '';

      if (years)
        result += years + (years === 1 ? ' year ' : ' years ');

      if (months)
        result += months + (months === 1 ? ' month' : ' months');

      return result;
    };
  });

});
