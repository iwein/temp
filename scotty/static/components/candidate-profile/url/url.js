define(function(require) {
  'use strict';
  var _ = require('underscore');
  var module = require('app-module');


  module.directive('hcCandidatePublicUrl', function(toaster, i18n) {
    return {
      template: require('text!./url.html'),
      scope: { model: '=' },
      link: function(scope) {
        _.extend(scope, {
          url: url,
          onUrlCopy: onUrlCopy,
        });


        function url() {
          return window.location.origin + '/employer/candidate/' + scope.model.id;
        }

        function onUrlCopy() {
          toaster.success(i18n.gettext('Link copied to clipboard'));
        }
      }
    };
  });
});
