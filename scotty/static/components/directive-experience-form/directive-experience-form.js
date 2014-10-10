define(function(require) {
  'use strict';
  require('session');
  var _ = require('underscore');
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
        hcRequired: '=',
        hcDisabled: '=',
      },
      transclude: true,
      template: require('text!./directive-experience-form.html'),
      controllerAs: 'experienceCtrl',
      controller: function($scope, $attrs, $q, ConfigAPI, Session) {
        $scope.onFeaturedSkillChange = onFeaturedSkillChange;
        $scope.searchCompanies = ConfigAPI.companies;
        $scope.searchSkills = searchSkills;
        $scope.searchRoles = ConfigAPI.roles;
        $scope.model = $scope.model || {};
        $scope.months = months;
        $scope.loading = false;
        $scope.submit = submit;
        this.isPristine = isPristine;
        this.setModel = setModel;
        this.reset = reset;
        this.save = save;

        ConfigAPI.countries({ limit: 500 }).then(fn.setTo('countries', $scope));
        nameAttr(this, 'hcExperienceForm', $scope, $attrs);
        bindDate('start');
        bindDate('end');

        ConfigAPI.featuredSkills().then(function(data) {
          $scope.featuredSkills = data.map(function(type) {
            return { value: type };
          });
        });

        function searchSkills(term) {
          var skills = $scope.featuredSkills
            .filter(fn.get('selected'))
            .map(fn.get('value'));

          return ConfigAPI.skills(term).then(function(data) {
            return data.filter(function(entry) {
              return skills.indexOf(entry) === -1;
            });
          });
        }

        function onFeaturedSkillChange() {
          $scope.skillSelected = $scope.featuredSkills.some(function(entry) {
            return entry.selected;
          });

          $scope.model.featuredSkills = $scope.featuredSkills
            .filter(fn.get('selected'))
            .map(fn.get('value'));
        }

        function save() {
          return Session.getUser().then(function(user) {
            var model = _.omit($scope.model, 'featuredSkills');
            model.skills = [].concat(model.skills || [], $scope.model.featuredSkills || []);

            return $q.when($scope.editing ? user.deleteExperience(model) : null).then(function() {
              return user.addExperience(model);
            });
          });
        }

        function reset() {
          $scope.editing = false;
          $scope.skills.setDirty(false);
          $scope.featuredSkills.forEach(fn.set('selected', false));
          $scope.formExperience.$setPristine();
          $scope.model = {};
          $scope.current = false;
          $scope.startMonth = '';
          $scope.startYear = '';
          $scope.endMonth = '';
          $scope.endYear = '';
        }

        function setModel(model) {
          model = JSON.parse(JSON.stringify(model));
          $scope.editing = !!model.id;
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

        function isPristine() {
          return $scope.formExperience.$pristine;
        }

        function submit() {
          $scope.onSubmit({ $model: $scope.model });
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
