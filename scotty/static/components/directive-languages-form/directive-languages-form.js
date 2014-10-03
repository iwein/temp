define(function(require) {
  'use strict';
  require('session');
  var nameAttr = require('tools/name-attr');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.directive('hcLanguagesForm', function() {
    return {
      restrict: 'EA',
      scope: {
        //model: '=ngModel',
        onSubmit: '&',
        hcShowEmpty: '=',
        hcDisabled: '=',
      },
      transclude: true,
      template: require('text!./directive-languages-form.html'),
      controllerAs: 'skillsCtrl',
      controller: function($scope, $attrs, ConfigAPI, Session) {
        $scope.searchLanguages = ConfigAPI.languages;
        $scope.remove = remove;
        $scope.setLanguage = validateLang;
        $scope.onBlur = onBlur;
        $scope.onChange = onChange;
        $scope.submit = submit;
        $scope.loading = false;
        $scope.model = [{}];
        this.setModel = setModel;
        this.reset = reset;
        this.save = save;

        nameAttr(this, 'hcLanguagesForm', $scope, $attrs);
        ConfigAPI.proficiencies().then(fn.setTo('proficiencies', $scope));

        function save() {
          return Session.getUser().then(function(user) {
            var model = $scope.model.slice(0, -1);
            return user.setLanguages(model);
          });
        }

        function reset() {
          $scope.editing = false;
          $scope.formLanguages.$setPristine();
          $scope.model = [{}];
        }

        function setModel(model) {
          $scope.model = JSON.parse(JSON.stringify(model));
          $scope.model.push({});
        }

        function remove(index) {
          $scope.model.splice(index, 1);
        }

        function validateLang(entry) {
          entry.errorInvalidLanguage = !ConfigAPI.isValidLanguage(entry.language);
        }

        function onBlur(entry, index, isLast) {
          entry.$dirty = true;
          validateLang(entry);
          if (!entry.language && !isLast)
            remove(index);
        }

        function onChange(entry, index, isLast) {
          validateLang(entry);
          if (entry.language && isLast)
            $scope.model.push({});
        }

        function submit() {
          if ($scope.model.some(function(entry) {
            if (!entry.language) return false;
            return entry.errorInvalidLanguage;
          })) return;

          $scope.onSubmit({ $model: $scope.model });
        }
      },
    };
  });
});
