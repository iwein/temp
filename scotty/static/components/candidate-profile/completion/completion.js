define(function(require) {
  'use strict';
  require('../completion-experience/completion-experience');
  require('../completion-education/completion-education');
  require('../completion-location/completion-location');
  require('../completion-target/completion-target');
  var _ = require('underscore');
  var module = require('app-module');


  module.directive('hcCandidateCompletion', function() {
    var ignore = [];

    return {
      template: require('text!./completion.html'),
      scope: { model: '=', },
      controller: function($scope) {
        _.extend(this, {
          refresh: refresh,
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
