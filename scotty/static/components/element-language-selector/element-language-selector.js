define(function(require) {
  'use strict';
  var moment = require('moment');
  var module = require('app-module');

  module.factory('i18n', function(gettextCatalog, ConfigAPI) {
    var listeners = [];
    var languages = [ 'en' ];
    var current;

    ConfigAPI.locales().then(function(response) {
      languages = response;
    });

    return {
      getLanguages: getLanguages,
      getCurrent: getCurrent,
      setLanguage: setLanguage,
      onChange: onChange,
    };

    function getCurrent() {
      return current;
    }

    function getLanguages() {
      return languages;
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
