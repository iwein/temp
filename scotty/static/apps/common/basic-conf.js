define(function(require) {
  'use strict';
  require('tools/loader-service');
  require('tools/notifier-service');
  require('tools/moment-directive');
  require('tools/greater-than-directive');
  require('tools/stars-directive/stars-directive');
  require('tools/linkedin-connect/linkedin-connect');
  require('tools/extend-directives/input-url-directive');
  require('tools/accordion-directive/accordion-directive');
  require('tools/extend-directives/input-integer-directive');
  require('tools/label-typeahead-directive/label-typeahead-directive');

  return function basicConf(module) {

    module.config(function($httpProvider) {
      $httpProvider.defaults.withCredentials = true;
    });

    module.run(function($templateCache) {
      $templateCache.put('footer.html', require('text!../common/footer.html'));
    });

    module.factory('toaster', function(Notifier) {
      Notifier.defaultError = function(error) {
        if (error) console.error(error);
        Notifier.error('Sorry, unknown error ocurred, if this error persist please contact EMAIL_HERE.');
      };

      return Notifier;
    });
  };
});
