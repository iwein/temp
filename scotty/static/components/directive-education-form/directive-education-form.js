define(function(require) {
  'use strict';
  require('session');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var nameAttr = require('tools/name-attr');
  var getModel = require('tools/get-model');
  var months = require('tools/months');
  var module = require('app-module');

  module.directive('hcEducationForm', function() {
    return {
      restrict: 'EA',
      transclude: true,
      template: require('text!./directive-education-form.html'),
      scope: {
        onSubmit: '&',
        hcRequired: '=',
        hcDisabled: '=',
      },
      controller: function($scope, $parse, $attrs, $q, ConfigAPI, Session) {
        _.extend($scope, {
          searchInstitutions: ConfigAPI.institutions,
          searchCourses: ConfigAPI.courses,
          submit: submit,
          months: months,
          currentYear: new Date().getFullYear(),
          loading: false,
        });
        _.extend(this, {
          isPristine: isPristine,
          setModel: setModel,
          reset: reset,
          save: save,
        });


        var ctrl = this;
        return onLoad();


        function submit() {
          if ($scope.form.$valid)
            $scope.onSubmit({ $model: $scope.model, $form: ctrl });
        }

        function isPristine() {
          return $scope.form.$pristine;
        }

        function onLoad() {
          var model = $attrs.ngModel ? getModel($parse($attrs.ngModel), $scope) : {};
          nameAttr(ctrl, 'hcEducationForm', $scope, $attrs);

          return ConfigAPI.degrees()
            .then(fn.setTo('degrees', $scope))
            .then(function() { setModel(model) });
        }

        function save() {
          return Session.getUser().then(function(user) {
            var preStep = $scope.editing ? user.deleteEducation($scope.model) : null;

            return $q.when(preStep).then(function() {
              return user.addEducation($scope.model);
            });
          });
        }

        function reset() {
          if ($scope.form)
            $scope.form.$setPristine();

          $scope.editing = false;
          $scope.model = {};
          $scope.current = false;
          $scope.not_completed_degree = false;
        }

        function setModel(model) {
          model = JSON.parse(JSON.stringify(model));
          $scope.editing = !!model.id;
          $scope.model = model;
          $scope.current = model.start && !model.end;
          $scope.not_completed_degree = model.start && !model.degree;
        }
      },
    };
  });
});
