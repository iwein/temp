define(function(require) {
  'use strict';
  var _ = require('underscore');
  var Date = require('tools/date');
  var months = require('tools/months');
  var module = require('app-module');


  module.directive('hcBirthdatePartial', function(toaster, i18n) {
    return {
      template: require('text!./birthdate-partial.html'),
      scope: { model: '=' },
      link: function(scope) {
        _.extend(scope, {
          updateDob: updateDob,
          months: months,
          close: close,
        });

        scope.$watch('model', update);
        i18n.onChange(translate);
        translate();

        function translate() {
          scope.months = months.map(i18n.gettext);
        }

        function update() {
          if (!scope.model) return;
          var date = Date.parse(scope.model);
          scope.dobYear = date.getFullYear();
          scope.dobMonth = scope.months[date.getMonth()];
          scope.dobDay = date.getDate();
        }

        function updateDob() {
          var year = scope.dobYear;
          var month = scope.dobMonth;
          var day = scope.dobDay;
          var monthIndex = scope.months.indexOf(month);
          scope.model = null;
          scope.errorTooYoung = false;
          scope.errorInvalidDate = false;

          if (!year || !month || !day)
            return;

          var date = Date.toUtcDate(Date.get(year, monthIndex, day));
          var dateAsString = Date.toStringDate(date);
          var introduced = year + '-' + pan(monthIndex + 1) + '-' + pan(day);
          var max = sixteenYearsAgo();

          scope.errorTooYoung = date > max;
          scope.errorInvalidDate = dateAsString !== introduced;

          if (!scope.errorTooYoung && !scope.errorInvalidDate)
            scope.model = dateAsString;
        }
      }
    };


    function pan(value) {
      return value < 10 ? '0' + value : value;
    }

    function sixteenYearsAgo() {
      var date = Date.now();
      date.setFullYear(date.getFullYear() - 16);
      return date;
    }
  });
});
