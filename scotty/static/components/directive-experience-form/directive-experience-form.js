define(function(require) {
  'use strict';
  require('session');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var nameAttr = require('tools/name-attr');
  var getModel = require('tools/get-model');
  var months = require('tools/months');
  var module = require('app-module');

  module.directive('hcExperienceForm', function(ConfigAPI) {
    var countries = ConfigAPI.countries({ limit: 500 });
    var featuredSkills = ConfigAPI.featuredSkills();

    return {
      restrict: 'EA',
      transclude: true,
      template: require('text!./directive-experience-form.html'),
      scope: {
        onSubmit: '&',
        hcShowEmpty: '=',
        hcRequired: '=',
        hcDisabled: '=',
      },
      controller: function($scope, $parse, $attrs, $q, Session) {
        _.extend($scope, {
          searchCompanies: ConfigAPI.companies,
          searchRoles: ConfigAPI.roles,
          onFeaturedSkillChange: onFeaturedSkillChange,
          onCurrentChange: onCurrentChange,
          searchSkills: searchSkills,
          submit: submit,
          months: months,
          currentYear: new Date().getFullYear(),
          loading: false,
        });
        _.extend(this, {
          showDuplicatedError: showDuplicatedError,
          isPristine: isPristine,
          setModel: setModel,
          reset: reset,
          save: save,
        });


        var ctrl = this;
        return onLoad();


        function afterModelChange() {
          $scope.model.country_iso = $scope.model.country_iso || 'DE';
        }

        function onFeaturedSkillChange() {
          $scope.skillSelected = $scope.featuredSkills.some(fn.get('selected'));
        }

        function showDuplicatedError(value) {
          $scope.duplicatedError = value;
        }

        function isPristine() {
          return $scope.form.$pristine;
        }

        function submit() {
          if ($scope.form.$valid) {
            var model = normalizeModel($scope.model);
            $scope.onSubmit({ $model: model, $form: ctrl });
          }
        }

        function onCurrentChange() {
          $scope.model = _.omit($scope.model, 'end');
          $scope.endMonth = '';
          $scope.endYear = '';
        }

        function onLoad() {
          var model = $attrs.ngModel ? getModel($parse($attrs.ngModel), $scope) : {};
          nameAttr(ctrl, 'hcExperienceForm', $scope, $attrs);

          return loadContent().then(function() {
            setModel(model);
            bindDate('start');
            bindDate('end');
            $scope.ready = true;
          });
        }

        function loadContent() {
          return $q.all([
            countries.then(fn.setTo('countries', $scope)),
            featuredSkills.then(function(data) {
              $scope.featuredSkills = data.map(function(type) {
                return { value: type };
              });
            }),
          ]);
        }

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

        function normalizeModel() {
          var model = _.omit($scope.model, 'featuredSkills');
          var featured = $scope.featuredSkills
            .filter(fn.get('selected'))
            .map(fn.get('value'));

          model.skills = [].concat(model.skills || [], featured || []);
          return model;
        }

        function save() {
          return Session.getUser().then(function(user) {
            var model = normalizeModel();
            var preStep = $scope.editing ? user.deleteExperience(model) : null;

            return $q.when(preStep).then(function() {
              return user.addExperience(model);
            });
          });
        }

        function reset() {
          if ($scope.form)
            $scope.form.$setPristine();

          $scope.featuredSkills.forEach(fn.set('selected', false));
          $scope.skills.setDirty(false);
          $scope.editing = false;
          $scope.model = {};
          $scope.duplicatedError = false;
          $scope.current = false;
          $scope.startMonth = '';
          $scope.startYear = '';
          $scope.endMonth = '';
          $scope.endYear = '';
          afterModelChange();
        }

        function setModel(model) {
          model = JSON.parse(JSON.stringify(model));
          $scope.editing = !!model.id;
          $scope.model = model;
          $scope.featuredSkills.forEach(fn.set('selected', false));

          if (model.skills && model.skills.length) {
            $scope.featuredSkills.some(function(featured) {
              var index = $scope.model.skills.indexOf(featured.value);
              if (index === -1)
                return;

              featured.selected = true;
              $scope.model.skills.splice(index, 1);
            });
          }

          if (model.start) {
            var start = new Date(model.start);
            $scope.startMonth = months[start.getMonth()];
            $scope.startYear = start.getFullYear();

            if (model.end) {
              var end = new Date(model.end);
              $scope.endMonth = months[end.getMonth()];
              $scope.endYear = end.getFullYear();
            }
          }

          $scope.current = model.start && !model.end;
          afterModelChange();
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
