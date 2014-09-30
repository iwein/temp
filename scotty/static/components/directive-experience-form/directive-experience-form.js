define(function(require) {
  'use strict';
  require('session');
  var nameAttr = require('tools/name-attr');
  var months = require('tools/months');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.directive('hcExperienceForm', function() {
    return {
      restrict: 'EA',
      scope: {
        //model: '=ngModel',
        onSubmit: '&',
        hcShowEmpty: '=',
      },
      transclude: true,
      template: require('text!./directive-experience-form.html'),
      controllerAs: 'experienceCtrl',
      controller: function($scope, $attrs, ConfigAPI, Session) {
        $scope.searchCompanies = ConfigAPI.companies;
        $scope.searchSkills = ConfigAPI.skills;
        $scope.searchRoles = ConfigAPI.roles;
        $scope.model = $scope.model || {};
        $scope.months = months;
        $scope.loading = false;
        this.setModel = setModel;
        this.reset = reset;
        this.save = save;

        ConfigAPI.countries({ limit: 500 }).then(fn.setTo('countries', $scope));
        nameAttr(this, 'hcEducationForm', $scope, $attrs);
        bindDate('start');
        bindDate('end');

        function save() {
          return Session.getUser().then(function(user) {
            return user.addExperience($scope.model);
          });
        }

        function reset() {
          $scope.formEducation.$setPristine();
          $scope.model = {};
          $scope.current = false;
          $scope.startMonth = '';
          $scope.startYear = '';
          $scope.endMonth = '';
          $scope.endYear = '';
        }

        function setModel(model) {
          $scope.model = model;
          if (model.start) {
            var start = new Date(model.start);
            $scope.startMonth = months[start.getMonth()];
            $scope.startYear = start.getFullYear();

            if (model.end) {
              var end = new Date(model.end);
              $scope.endMonth = months[end.getMonth()];
              $scope.endYear = start.getFullYear();
            } else {
              $scope.current = true;
            }
          } else {
            $scope.current = false;
          }
        }

        function bindDate(key) {
          var month = key + 'Month';
          var year = key + 'Year';
          var storedValue = $scope.model[key];

          if (storedValue) {
            var date = new Date(storedValue);
            $scope[year] = date.getFullYear();
            $scope[month] = months[date.getMonth()];
          }

          $scope[key + 'DateUpdate'] = function() {
            var value = null;

            if ($scope[month] && $scope[year]) {
              var date = new Date($scope[year], months.indexOf($scope[month]));
              value = date.getFullYear() + '-' + (date.getMonth() + 1) + '-01';
            }

            $scope.model[key] = value;
          };
        }
      },
    };
  });
});
