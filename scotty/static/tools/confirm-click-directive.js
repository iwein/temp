define(function(require) {
  'use strict';
  var module = require('app-module');

  module.directive('hcConfirmClick', function($q, $timeout) {
    return {
      priority: 1,
      terminal: true,
      restrict: 'A',
      link: function(scope, elem, attrs) {
        var element = elem[0];
        var isConfirmation = false;
        var originalText;

        function startConfirm(event) {
          var message = attrs.hcConfirmClick;
          originalText = element.innerHTML;
          element.innerHTML = message;
          event.stopImmediatePropagation();
          event.preventDefault();
          $timeout(stopConfirm, 2000);
          isConfirmation = true;
        }

        function stopConfirm() {
          element.innerHTML = originalText;
          isConfirmation = false;
        }

        element.addEventListener('click', function(event) {
          if (!isConfirmation)
            return startConfirm(event);

          $q.when(scope.$eval(attrs.ngClick))
            .then(stopConfirm);
        }, false);
      }
    };
  });
});
