define(function(require) {
  'use strict';
  require('components/directive-education-form/directive-education-form');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');


  module.directive('hcCandidateEducation', function(toaster) {
    return {
      template: require('text!./education.html'),
      scope: { model: '=' },
      link: function(scope, elem, attr) {
        // For some reason JSHint complains if I move this function to the end
        function close() {
          scope.editing = -1;
          return profile.closeForm('education');
        }


        var profile = scope.profile = scope.$parent.profile;
        _.extend(scope, {
          formContainer: {},
          editable: 'hcEditable' in attr,
          isEmpty: isEmpty,
          remove: remove,
          close: close,
          edit: edit,
          save: save,
          add: add,
        });

        scope.model.getHighestDegree().then(fn.setTo('highestDegree', scope));
        scope.$watch('model.$revision', function() {
          scope.data = scope.model.getEducationCached();
          elem.parent()[isEmpty() ? 'addClass' : 'removeClass']('empty');
        });


        function isEmpty() {
          return !(scope.data && scope.data.length);
        }

        function add() {
          scope.formContainer.form.reset();
          scope.editing = -2;
          return profile.openForm('education');
        }

        function edit(model, index) {
          scope.editing = index;
          return profile.openForm('education');
        }

        function remove(model) {
          return scope.model.deleteEducation(model)
            .then(refresh)
            .then(close)
            .catch(toaster.defaultError);
        }

        function save(model, form) {
          scope.loading = true;
          return form.save()
            .then(refresh)
            .then(close)
            .catch(toaster.defaultError)
            .finally(function() { scope.loading = false });
        }

        function refresh() {
          return scope.model.getEducation(scope.model);
        }
      }
    };
  });
});
