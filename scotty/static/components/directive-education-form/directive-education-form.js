define(function(require) {
  'use strict';
  require('session');
  var nameAttr = require('tools/name-attr');
  var months = require('tools/months');
  var module = require('app-module');

  module.directive('hcEducationForm', function($parse) {
    function getModel(ngModel, scope) {
      var model = $parse(ngModel);
      var value = model(scope) || model(scope.$parent) || model(scope.$parent.$parent);
      return JSON.parse(JSON.stringify(value));
    }

    return {
      restrict: 'EA',
      scope: {
        onSubmit: '&',
        hcShowEmpty: '=',
        hcRequired: '=',
        hcDisabled: '=',
      },
      transclude: true,
      template: require('text!./directive-education-form.html'),
      controllerAs: 'educationCtrl',
      controller: function($scope, $attrs, $q, ConfigAPI, Session) {
        $scope.searchInstitutions = ConfigAPI.institutions;
        $scope.searchCourses = ConfigAPI.courses;
        ConfigAPI.degrees().then(function(degrees) {
          $scope.degrees = degrees;
          setModel($attrs.ngModel ? getModel($attrs.ngModel, $scope) : {});
        });

        $scope.submit = submit;
        $scope.months = months;
        $scope.currentYear = (new Date()).getFullYear();
        $scope.loading = false;
        this.isPristine = isPristine;
        this.setModel = setModel;
        this.reset = reset;
        this.save = save;
        var ctrl = this;

        nameAttr(this, 'hcEducationForm', $scope, $attrs);

        function save() {
          return Session.getUser().then(function(user) {
            return $q.when($scope.editing ? user.deleteEducation($scope.model) : null).then(function() {
              return user.addEducation($scope.model);
            });
          });
        }

        function submit() {
          $scope.onSubmit({ $model: $scope.model, $form: ctrl });
        }

        function reset() {
          $scope.editing = false;
          if ($scope.formEducation)
            $scope.formEducation.$setPristine();
          $scope.model = {};
          $scope.current = false;
          $scope.not_completed_degree = false;
        }

        function isPristine() {
          return $scope.formEducation.$pristine;
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
