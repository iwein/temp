define(function(require) {
  'use strict';
  require('session');
  var nameAttr = require('tools/name-attr');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.directive('hcSkillsForm', function() {
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
      controller: function($scope, $attrs, $q, ConfigAPI, Session) {
        $scope.searchSkills = searchSkills;
        $scope.remove = remove;
        $scope.onChange = onChange;
        $scope.onBlur = onBlur;
        $scope.submit = submit;
        $scope.model = $scope.model || [];
        $scope.model.push({});
        $scope.skills = [];
        this.setModel = setModel;
        this.reset = reset;
        this.save = save;

        nameAttr(this, 'hcSkillsForm', $scope, $attrs);
        ConfigAPI.skillLevels().then(fn.setTo('levels', $scope));

        function save() {
          return Session.getUser().then(function(user) {
            return user.setSkills(getSkills());
          });
        }

        function reset() {
          $scope.editing = false;
          $scope.formSkills.$setPristine();
          $scope.model = [{}];
          $scope.skills = [];
        }

        function setModel(model) {
          var hasLevel = fn.get('level');

          $scope.model = model
            .filter(hasLevel);

          $scope.skills = model
            .filter(fn.not(hasLevel))
            .map(fn.get('skill'));

          $scope.model.push({});
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
        }

        function onBlur(entry, index, isLast) {
          if (!entry.skill && !isLast)
            remove(index);
        }

        function onChange(entry, index, isLast) {
          if (entry.skill && isLast)
            $scope.model.push({});
        }

        function getSkills() {
          var withLevel = $scope.model.slice(0, -1);
          var withoutLevel = $scope.skills.map(function(skill) {
            return { skill: skill, level: null };
          });
          return withLevel.concat(withoutLevel);
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
