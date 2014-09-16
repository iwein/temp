define(function(require) {
  'use strict';
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
      toaster.defaultError = function() {
        toaster.pop(
          'error',
          'Error',
          'Sorry, unknown error ocurred, if this error persist please contact EMAIL_HERE.'
        );
      };
    });
  };
});
