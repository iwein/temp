define(function(require) {
  'use strict';
  require('components/directive-experience-form/directive-experience-form');
  var _ = require('underscore');
  var module = require('app-module');


  module.directive('hcCandidateExperience', function() {
    return {
      template: require('text!./experience.html'),
      scope: { model: '=' },
      link: function(scope, elem, attr) {
        // For some reason JSHint complains if I move this function to the end
        function close() {
          scope.editing = -1;
          return profile.closeForm('experience');
        }


        var profile = scope.profile = scope.$parent.profile;
        _.extend(scope, {
          formContainer: {},
          editable: 'hcEditable' in attr,
          isEmpty: isEmpty,
          close: close,
          edit: edit,
          save: save,
          add: add,
        });

        scope.$watch('model.$revision', function() {
          scope.data = update(scope.model.getExperienceCached());
          elem.parent()[isEmpty() ? 'addClass' : 'removeClass']('empty');
        });


        function isEmpty() {
          return !(scope.data && scope.data.length);
        }

        function add() {
          scope.formContainer.form.reset();
          scope.editing = -2;
          return profile.openForm('experience');
        }
        function edit(model, index) {
          scope.editing = index;
          return profile.openForm('experience');
        }
        function save(model, form) {
          scope.loading = true;
          return form.save()
            .then(scope.model.getExperience.bind(scope.model))
            .then(close)
            .finally(function() { scope.loading = false });
        }

        function update(list) {
          if (!list) return;

          var total = 0;
          var timeline = list.map(function(entry) {
            var start = Date.parse(entry.start);
            var end = entry.end ? Date.parse(entry.end) : Date.now();
            var duration = end - start;
            total += duration;
            return {
              start: start,
              duration: duration,
              role: entry.role
            };
          }).filter(function(entry) {
            return entry.duration !== 0;
          });

          timeline.forEach(function(entry) {
            entry.percent = 100 / total * entry.duration;
          });
          scope.totalWorkExperience = total;
          scope.timeline = timeline.sort(function(a, b) {
            return a.start - b.start;
          });

          return list;
        }
      }
    };
  });
});
