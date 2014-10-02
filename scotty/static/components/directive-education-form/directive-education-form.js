define(function(require) {
  'use strict';
  require('session');
  var nameAttr = require('tools/name-attr');
  var months = require('tools/months');
  var module = require('app-module');

  module.directive('hcEducationForm', function() {
    return {
      restrict: 'EA',
      scope: {
        //model: '=ngModel',
        onSubmit: '&',
        hcShowEmpty: '=',
      },
      transclude: true,
      template: require('text!./directive-education-form.html'),
      controllerAs: 'educationCtrl',
      controller: function($scope, $attrs, ConfigAPI, Session) {
        $scope.searchInstitutions = ConfigAPI.institutions;
        $scope.searchCourses = ConfigAPI.courses;
        $scope.searchDegrees = ConfigAPI.degrees;
        $scope.model = $scope.model || {};
        $scope.months = months;
        $scope.loading = false;
        this.setModel = setModel;
        this.reset = reset;
        this.save = save;

        nameAttr(this, 'hcEducationForm', $scope, $attrs);

        function save() {
          return Session.getUser().then(function(user) {
            return user.addEducation($scope.model);
          });
        }

        function reset() {
          $scope.formEducation.$setPristine();
          $scope.model = {};
          $scope.current = false;
          $scope.not_completed_degree = false;
        }

        function setModel(model) {
          $scope.model = model;
          $scope.current = model.start && !model.end;
          $scope.not_completed_degree = model.start && !model.degree;
        }
      },
    };
  });
});
