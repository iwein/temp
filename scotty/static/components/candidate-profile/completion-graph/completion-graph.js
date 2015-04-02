define(function(require) {
  'use strict';
  var module = require('app-module');


  module.directive('hcCompletionGraph', function(toaster, i18n) {
    return {
      template: require('text!./completion-graph.html'),
      require: '^hcCandidateCompletion',
      scope: { model: '=' },
      link: function(scope) {
        var bgColor = '#696969';

        i18n.onChange(translate);
        scope.$watch('model.$revision', function() {
          var stage = scope.model.getSignupStageCached();
          update((stage && stage.completion) || 0);
        });


        function update(value) {
          scope.value = value;
          scope.percent = Math.round(value * 100);
          scope.color = getColor(value);
          scope.bgFormula = getBgFormula();
          translate();
        }

        function translate() {
          scope.message = i18n.gettext(getMessage(scope.value));
        }

        function getColor(value) {
          if (value > 0.66)
            return 'green';
          if (value > 0.33)
            return 'yellow';
          return 'red';
        }

        function getMessage(value) {
          if (value > 0.66)
            return 'On your way to pro';
          if (value > 0.33)
            return 'Better then beginner';
          return 'Beginner';
        }

        function getBgFormula() {
          return 'linear-gradient(bottom, ' + scope.color + ' ' + scope.percent + '%, ' + bgColor + ' 0)';
        }
      }
    };
  });
});
