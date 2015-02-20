define(function(require) {
  'use strict';
  require('moment-de');
  require('tools/loader-service');
  require('tools/scope-directive');
  require('tools/notifier-service');
  require('tools/moment-directive');
  require('tools/focusme-directive');
  require('tools/greater-than-directive');
  require('tools/typeahead-loader-directive');
  require('tools/validate-on-submit-directive');
  require('tools/xing-connect/xing-connect');
  require('tools/stars-directive/stars-directive');
  require('tools/linkedin-connect/linkedin-connect');
  require('tools/extend-directives/input-url-directive');
  require('tools/accordion-directive/accordion-directive');
  require('tools/extend-directives/input-integer-directive');
  require('tools/label-typeahead-directive/label-typeahead-directive');
  require('components/element-pager/element-pager');
  require('components/element-pagination/element-pagination');
  require('components/element-offer-link/element-offer-link');
  require('components/element-employer-link/element-employer-link');
  require('components/element-candidate-link/element-candidate-link');
  require('components/element-language-selector/element-language-selector');
  require('./translations');
  var conf = require('conf');

  if (window.ga) {
    window.ga('create', conf.ga_id, 'auto');
    window.ga('require', 'displayfeatures');
  }

  return function basicConf(module) {
    module.config(function($httpProvider, LightboxProvider) {
      $httpProvider.defaults.withCredentials = true;
      LightboxProvider.templateUrl = 'lightbox-custom.html';
    });

    module.run(function($templateCache, $rootScope, i18n) {
      $templateCache.put('lightbox-custom.html', require('text!../../tools/lightbox-custom.html'));
      $templateCache.put('footer.html', require('text!../common/footer.html'));
      $rootScope.translate = i18n.gettext;
      i18n.setLanguage('en');
    });

    module.factory('toaster', function(Notifier, gettext) {
      Notifier.defaultError = function(error) {
        if (error) console.error(error);
        var message = gettext('Sorry, unknown error occurred, if this error persists please contact') +
          ' <a target="_blank" href="mailto:' + conf.support_email + '">' + conf.support_email + '</a>';

        Notifier.error(message, { html: true });
      };

      return Notifier;
    });
  };
});
