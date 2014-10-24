define(function(require) {
  'use strict';
  require('tools/loader-service');
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

    module.run(function(toaster) {
      toaster.error = function(message) {
        toaster.pop('error', '', message);
      };
      toaster.warning = function(message) {
        toaster.pop('warning', '', message);
      };
      toaster.info = function(message) {
        toaster.pop('info', '', message);
      };
      toaster.success = function(message) {
        toaster.pop('success', '', message);
      };
      toaster.defaultError = function(error) {
        if (error)
          console.error(error);

        toaster.pop(
          'error',
          'Error',
          'Sorry, unknown error ocurred, if this error persist please contact EMAIL_HERE.'
        );
      };
    });
  };
});
