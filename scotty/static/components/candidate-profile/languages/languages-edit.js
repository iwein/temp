define(function(require) {
  'use strict';
  var _ = require('underscore');
  var fn = require('tools/fn');
  var parser = require('./languages-parser');
  var module = require('app-module');


  module.directive('hcCandidateLanguagesEdit', function(toaster, ConfigAPI) {
    var proficiencies = ConfigAPI.proficiencies();
    var featured = [];
    ConfigAPI.featuredLanguages().then(function(response) {
      featured = response;
    });

    return {
      template: require('text!./languages-edit.html'),
      scope: { model: '=', },
      link: function(scope) {
        // For some reason JSHint complains if I move this function to the end
        function close() {
          scope.editing = false;
          return profile.closeForm('languages');
        }


        var profile = scope.profile = scope.$parent.profile;
        var valid = [];

        proficiencies.then(fn.setTo('proficiencies', scope));
        _.extend(scope, {
          searchLanguages: ConfigAPI.languages,
          validateLang: validateLang,
          onChange: onChange,
          onBlur: onBlur,
          remove: remove,
          close: close,
          edit: edit,
          save: save,
        });



        function edit() {
          scope.data = parser.get(scope.model);
          valid = scope.data.map(fn.get('language'));
          if (!scope.data.length)
            scope.data = featured.map(function(value) { return { language: value } });

          scope.data.push({});
          scope.editing = true;
          return profile.openForm('languages');
        }

        function save() {
          if (!isValid())
            return;

          scope.loading = true;
          var data = scope.data.slice(0, -1);
          return parser.set(scope.model, data)
            .then(close)
            .catch(toaster.defaultError)
            .finally(function() { scope.loading = false });
        }

        function remove(index) {
          scope.data.splice(index, 1);
        }

        function validateLang(entry) {
          entry.errorInvalidLanguage = (
            valid.indexOf(entry.language) === -1 &&
            !ConfigAPI.isValidLanguage(entry.language)
          );
        }

        function onBlur(entry, index, isLast) {
          entry.$dirty = true;
          validateLang(entry);
          if (!entry.language && !isLast)
            remove(index);
        }

        function onChange(entry, index, isLast) {
          validateLang(entry);
          if (entry.language && isLast)
            scope.data.push({});
        }

        function isValid() {
          return !scope.data.some(function(entry) {
            if (!entry.language) return false;
            return entry.errorInvalidLanguage;
          });
        }
      }
    };
  });
});
