/*globals console */

define(function(require) {
  'use strict';
  var moment = require('moment');
  var module = require('app-module');

  module.factory('i18n', function(gettextCatalog, ConfigAPI) {
    var listeners = [];
    var languages = [ 'en', 'de' ];
    var current;

    if (DEBUG) {
      gettextCatalog.debug = true;
      var getString = gettextCatalog.getString;
      gettextCatalog.getString = function(string, context) {
        var result = getString.call(gettextCatalog, string, context);
        if (result && result.indexOf('[MISSING]') === 0)
          console.warn('Missing translation:', string, result, context);
        return result;
      };
    }

    ConfigAPI.locales().then(function(response) {
      languages = response;
    });

    return {
      getLanguages: getLanguages,
      getCurrent: getCurrent,
      setLanguage: setLanguage,
      onChange: onChange,
      gettext: gettext,
    };

    function getCurrent() {
      return current;
    }

    function getLanguages() {
      return languages;
    }

    function gettext(string, context) {
      return gettextCatalog.getString(string, context);
    }

    function setLanguage(lang) {
      current = lang;
      moment.locale(lang);
      gettextCatalog.setCurrentLanguage(lang);
      listeners.map(function(fn) { fn(lang) });
    }

    function onChange(fn) {
      listeners.push(fn);
    }
  });

  module.directive('hcLanguageSelector', function(i18n) {
    return {
      restrict: 'E',
      template: require('text!./element-language-selector.html'),
      link: function(scope) {
        scope.i18n = i18n;
      }
    };
  });
});
