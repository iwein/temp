define(function(require) {
  'use strict';
  var _ = require('underscore');
  var Date = require('tools/date');
  var months = require('tools/months');
  var parser = require('./birthdate-parser');
  var module = require('app-module');


  module.directive('hcCandidateBirthdateEdit', function(toaster, i18n) {
    return {
      template: require('text!./birthdate-edit.html'),
      scope: { model: '=', },
      link: function(scope) {
        // For some reason JSHint complains if I move this function to the end
        function close() {
          scope.editing = false;
          return profile.closeForm('birthdate');
        }


        var profile = scope.profile = scope.$parent.profile;
        _.extend(scope, {
          updateDob: updateDob,
          months: months,
          close: close,
          edit: edit,
          save: save,
        });

        i18n.onChange(translate);
        translate();


        function translate() {
          scope.months = months.map(i18n.gettext);
        }

        function edit() {
          scope.data = parser.get(scope.model);
          scope.editing = true;
          return profile.openForm('birthdate');
        }

        function save() {
          scope.loading = true;
          return parser.set(scope.model, scope.data)
            .then(close)
            .catch(toaster.defaultError)
            .finally(function() { scope.loading = false });
        }

        function updateDob() {
          var year = scope.dobYear;
          var month = scope.dobMonth;
          var day = scope.dobDay;
          var monthIndex = scope.months.indexOf(month);
          scope.data.dob = null;
          scope.errorTooYoung = false;
          scope.errorInvalidDate = false;

          if (!year || !month || !day)
            return;

          var date = Date.get(year, monthIndex, day, 12);
          var dateAsString = date.toISOString().split('T')[0];
          var introduced = year + '-' + pan(monthIndex + 1) + '-' + pan(day);
          var max = sixteenYearsAgo();

          scope.errorTooYoung = date > max;
          scope.errorInvalidDate = dateAsString !== introduced;

          if (!scope.errorTooYoung && !scope.errorInvalidDate)
            scope.data.dob = dateAsString;
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
