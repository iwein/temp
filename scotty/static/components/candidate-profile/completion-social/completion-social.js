define(function(require) {
  'use strict';
  require('components/element-connectors-buttons/element-connectors-buttons')
  var module = require('app-module');


  module.directive('hcCandidateCompletionSocial', function(Session) {
    return {
      template: require('text!./completion-social.html'),
      scope: { model: '=', },
      link: function(scope) {
        var connectors = Session.getConnectors();
        var candidate = scope.model;
        var experience = candidate.getExperienceCached()
        var education = candidate.getEducationCached();
        var hasExperience = experience && experience.length;
        var hasEducation = education && education.length;
        var promises = [];

        if (!hasExperience) {
          promises.push(connectors.getExperience().then(function(list) {
            return list && list.length && candidate.setExperience(list).then(function() {
              hasExperience = true;
              return candidate.getExperience();
            });
          }));
        }

        if (!hasEducation) {
          promises.push(connectors.getEducation().then(function(list) {
            return list && list.length && candidate.setEducation(list).then(function() {
              hasEducation = true;
              return candidate.getEducation();
            });
          }))
        }

        Promise.all(promises).then(function(result) {
          if (hasExperience && hasEducation)
            scope.imported = true;
          scope.ready = true;
        });
      }
    };
  });
});
