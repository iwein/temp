define(function(require) {
  'use strict';
  require('session');
  var nameAttr = require('tools/name-attr');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.directive('hcSkillsForm', function($parse) {
    function getModel(ngModel, scope) {
      var model = $parse(ngModel);
      var value = model(scope) || model(scope.$parent) || model(scope.$parent.$parent);
      return JSON.parse(JSON.stringify(value));
    }

    return {
      restrict: 'EA',
      scope: {
        //model: '=ngModel',
        onSubmit: '&',
        hcShowEmpty: '=',
        hcDisabled: '=',
      },
      transclude: true,
      template: require('text!./directive-skills-form.html'),
      controllerAs: 'skillsCtrl',
      controller: function($scope, $attrs, ConfigAPI, Session) {
        $scope.searchSkillsProtected = searchSkillsProtected;
        $scope.searchSkills = searchSkills;
        $scope.remove = remove;
        $scope.onChange = onChange;
        $scope.onBlur = onBlur;
        $scope.recheck = recheck;
        $scope.submit = submit;
        $scope.model = $scope.model || [];
        $scope.skills = [];
        this.setModel = setModel;
        this.reset = reset;
        this.save = save;
        var ctrl = this;
        var enabled = false;

        recheck();

        nameAttr(this, 'hcSkillsForm', $scope, $attrs);
        ConfigAPI.skillLevels()
          .then(fn.setTo('levels', $scope))
          .then(function() {
            setModel($attrs.ngModel ? getModel($attrs.ngModel, $scope) : []);
          });

        function recheck() {
          for (var i = $scope.model.length; i--; ) {
            if (!$scope.model[i].skill)
              $scope.model.splice(i, 1);
          }

          ctrl.$valid = $scope.model.length >= 3 && $scope.model.every(function(entry) {
            return typeof entry.level === 'string';
          });

          if ($scope.model.length > 2)
            $scope.model.push({});
          else while ($scope.model.length < 3)
            $scope.model.push({});
        }

        function getSkills() {
          var withLevel = $scope.model.filter(function(skill) {
            return !!skill.skill;
          });
          var withoutLevel = $scope.skills.map(function(skill) {
            return { skill: skill, level: null };
          });
          return withLevel.concat(withoutLevel);
        }

        function save() {
          return Session.getUser().then(function(user) {
            return user.setSkills(getSkills());
          });
        }

        function reset() {
          $scope.editing = false;
          $scope.formSkills.$setPristine();
          $scope.model = [];
          $scope.skills = [];
          recheck();
        }

        function setModel(model) {
          var hasLevel = fn.get('level');
          model = JSON.parse(JSON.stringify(model));

          $scope.model = model
            .filter(hasLevel);

          $scope.skills = model
            .filter(fn.not(hasLevel))
            .map(fn.get('skill'));

          recheck();
        }

        function searchSkillsProtected(term) {
          return enabled ? searchSkills(term) : [];
        }

        function searchSkills(term) {
          var skills = getSkills().map(fn.get('skill'));

          return ConfigAPI.skills(term).then(function(data) {
            return data.filter(function(entry) {
              return skills.indexOf(entry) === -1;
            });
          });
        }

        function remove(index) {
          $scope.model.splice(index, 1);
          recheck();
        }

        function onBlur(entry, index) {
          if (!entry.skill)
            remove(index);
          recheck();
        }

        function onChange() {
          enabled = true;
          recheck();
        }

        function submit() {
          var skills = _.uniq(getSkills(), false, fn.get('skill'));

          $scope.loading = true;
          Session.user.setSkills(skills)
            .then($scope.signup.nextStep)
            .finally(fn.setTo('loading', $scope));
        }
      },
    };
  });
});
