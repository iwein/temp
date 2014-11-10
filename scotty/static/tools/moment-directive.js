define(function(require) {
  'use strict';
  var moment = require('moment');
  var module = require('app-module');

  module.filter('moment', function() {
    return function(value, format) {
      return value ? moment.utc(value).format(format) : '';
    };
  });

  module.filter('momentDate', function() {
    return function(value) {
      return value ? moment.utc(value).format('MMMM Do, YYYY') : '';
    };
  });

  module.filter('timeAgo', function() {
    return function(value) {
      return value ? moment.utc(value).fromNow() : '';
    };
  });

  module.filter('timeAgoIf', function() {
    return function(value, from) {
      value = moment.utc(value);
      if (from === 'yesterday')
        from = moment().subtract(1, 'day');
      return value.isBefore(from) ? value.format('MMMM Do, YYYY') : value.fromNow();
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

  module.filter('yearMonth', function() {
    return function(value, size) {
      if (size && size < 5) return '';
      var months = Math.ceil(value / 1000 / 60 / 60 / 24 / 30);
      var years = Math.floor(months / 12);
      var result = '';
      months %= 12;

      if (size && size < 5) return '';
      if (years) result += years + (size && size < 15 ? 'y ' : ' years ');
      if (months) result += months + (size && size < 15 ? 'm' : ' months');

      return result;
    };
  });

});
