define(function(require) {
  'use strict';
  require('components/element-connectors-buttons/element-connectors-buttons');
  require('../completion-availability/completion-availability');
  require('../completion-birthdate/completion-birthdate');
  require('../completion-city/completion-city');
  require('../completion-cv/completion-cv');
  require('../completion-education/completion-education');
  require('../completion-education/completion-education-further');
  require('../completion-experience/completion-experience');
  require('../completion-experience/completion-experience-further');
  require('../completion-graph/completion-graph');
  require('../completion-languages/completion-languages');
  require('../completion-location/completion-location');
  require('../completion-picture/completion-picture');
  require('../completion-skills/completion-skills');
  require('../completion-summary/completion-summary');
  require('../completion-target/completion-target');
  var _ = require('underscore');
  var module = require('app-module');


  module.directive('hcCandidateCompletion', function(Session) {
    var ignore = [];

    return {
      template: require('text!./completion.html'),
      scope: { model: '=', },
      controller: function($scope, $element) {
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
          var step = $scope.step = getNextStep(stage);
          importSocial();
          $element.parent()[step ? 'addClass' : 'removeClass']('completion');
        }

        function refresh() {
          return $scope.model.getSignupStage();
        }

        function getNextStep(stage) {
          if ($scope.close) return null;

          var order = stage.ordering.slice();
          return order.reverse().reduce(function(result, step) {
            if (ignore.indexOf(step) !== -1) return result;
            return stage[step] ? result : step;
          }, null);
        }

        var importing = false;
        function importSocial() {
          if (importing) return;

          var connectors = Session.getConnectors();
          var candidate = $scope.model;
          var experience = candidate.getExperienceCached();
          var education = candidate.getEducationCached();
          var hasExperience = experience && experience.length;
          var hasEducation = education && education.length;
          var isExperienceImported = false;
          var isEducationImported = false;
          var promises = [];

          if (!hasExperience) {
            promises.push(connectors.getExperience().then(function(list) {
              return list && list.length && candidate.setExperience(list).then(function() {
                isExperienceImported = true;
                hasExperience = true;
                return candidate.getExperience();
              });
            }));
          }

          if (!hasEducation) {
            promises.push(connectors.getEducation().then(function(list) {
              return list && list.length && candidate.setEducation(list).then(function() {
                isEducationImported = true;
                hasEducation = true;
                return candidate.getEducation();
              });
            }));
          }

          importing = true;
          return Promise.all(promises).then(function() {
            if (isExperienceImported || isEducationImported)
              return refresh();
          }).then(function() {
            importing = false;
          });
        }
      }
    };
  });
});
