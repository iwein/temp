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

  module.filter('momentDiff', function() {
    return function(value) {
      if (typeof value.start === 'number') {
        var endYear = value.end || new Date().getFullYear();
        return (endYear - value.start) * 365 * 24 * 60 * 60 * 1000;
      }

      var end = value.end || new Date();
      return moment.utc(end).diff(moment.utc(value.start));
    };
  });

  module.filter('toMonthsYears', function() {
    return function(value) {
      var total = value / 1000 / 60 / 60 / 24 / 365;
      var years = Math.floor(total);
      var months = Math.round((total % 1) * 12);
      var result = '';

      if (years)
        result += years + (years === 1 ? ' year ' : ' years ');

      if (months)
        result += months + (months === 1 ? ' month' : ' months');

      return result;
    };
  });

  module.filter('showMonthYear', function() {
    return function(value) {
      return ['today', 'current'].indexOf(value)>=0 ?
        value :
        moment.utc(value, 'YYYY-MM-DD').format('MMM YYYY');
    };
  });

  module.filter('yearMonth', function() {
    return function(value, size) {
      if (size && size < 5) return '';
      var months = Math.ceil(value / 1000 / 60 / 60 / 24 / 30);
      var years = Math.floor(months / 12);
      var result = '';
      months %= 12;

      if (years) result += years + (size && size < 15 ? 'y ' : ' years ');
      if (months) result += months + (size && size < 15 ? 'm' : ' months');
      return result || 'less than one month';
    };
  });

});
