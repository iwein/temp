define(function(require) {
  'use strict';
  require('components/element-connectors-buttons/element-connectors-buttons');
  require('../completion-birthdate/completion-birthdate');
  require('../completion-city/completion-city');
  require('../completion-education/completion-education');
  require('../completion-experience/completion-experience');
  require('../completion-graph/completion-graph');
  require('../completion-languages/completion-languages');
  require('../completion-location/completion-location');
  require('../completion-skills/completion-skills');
  require('../completion-target/completion-target');
  var _ = require('underscore');
  var module = require('app-module');


  module.directive('hcCandidateCompletion', function() {
    var ignore = [];

    return {
      template: require('text!./completion.html'),
      scope: { model: '=', },
      controller: function($scope) {
        // For some reason JSHint complains if I move this function to the end
        function close() {
          $scope.close = true;
          update();
        }


        _.extend(this, {
          refresh: refresh,
          close: close,
          skip: skip,
        });

        $scope.$watch('model.$revision', update);


        function skip() {
          ignore.push($scope.step);
          update();
        }

        function update() {
          var stage = $scope.model.getSignupStageCached();
          $scope.step = getNextStep(stage);
        }

        function refresh() {
          return $scope.model.getSignupStage();
        }

        function getNextStep(stage) {
          if ($scope.close) return null;

          var order = stage.ordering.slice();
          return order.reverse().reduce(function(result, step) {
            if (ignore.indexOf(step) !== -1) return result;
            return stage[step] === false ? step : result;
          }, null);
        }
      }
    };
  });
});
