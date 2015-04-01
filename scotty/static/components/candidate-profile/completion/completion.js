define(function(require) {
  'use strict';
  require('../completion-experience/completion-experience');
  require('../completion-location/completion-location');
  require('../completion-target/completion-target');
  var _ = require('underscore');
  var module = require('app-module');


  module.directive('hcCandidateCompletion', function() {
    return {
      template: require('text!./completion.html'),
      scope: { model: '=', },
      link: function(scope) {
        _.extend(scope, {
          onSubmit: onSubmit,
        });

        scope.$watch('model.$revision', function() {
          var stage = scope.model.getSignupStageCached();
          scope.step = getNextStep(stage);
        });


        function onSubmit() {
          return scope.model.getSignupStage();
        }

        function getNextStep(stage) {
          var order = stage.ordering.slice();
          return order.reverse().reduce(function(result, step) {
            return stage[step] === false ? step : result;
          }, null);
        }
      }
    };
  });
});
