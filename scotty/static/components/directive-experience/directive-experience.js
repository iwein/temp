define(function(require) {
  'use strict';
  require('session');
  var nameAttr = require('tools/name-attr');
  var module = require('app-module');

  module.directive('hcExperience', function() {
    return {
      restrict: 'EA',
      transclude: true,
      scope: {
        hcTitle: '@',
        onAdd: '&',
        onLoad: '&',
        onEdit: '&',
        onRemove: '&',
        hcSource: '&',
        hcSourceRemove: '&',
        hcEditable: '=',
        hcRemoveLast: '=',
        hcAutomaticAdd: '=',
      },
      template: require('text!./directive-experience.html'),
      controllerAs: 'hcExperienceCtrl',
      controller: function($scope, $attrs) {
        var self = this;
        $scope.edit = edit;
        $scope.remove = remove;
        $scope.submit = submit;
        $scope.formContainer = {};
        $scope.active = -1;
        $scope.meta = [];
        this.setActive = setActive;
        this.refresh = list;
        this.add = add;

        nameAttr(this, 'hcExperience', $scope, $attrs);
        list().then(function() {
          $scope.onLoad();
        });

        function setActive(index) {
          if ($scope.formContainer.form)
            $scope.formContainer.form.reset();

          $scope.active = index;
          $scope.editing = index !== -1;
        }

        function add() {
          setActive(-1);
          $scope.adding = true;
        }

        function edit(model, form, index) {
          return $scope.onEdit({
            $entry: model,
            $form: form,
            $index: index,
          }).then(function() {
            return list();
          }).then(function() {
            return setActive(-1);
          });
        }

        function submit(model, form) {
          return $scope.onAdd({
            $entry: model,
            $form: form,
          }).then(function() {
            $scope.adding = false;
            return list();
          }).then(function() {
            return setActive(-1);
          });
        }

        function remove(entry) {
          return $scope.hcSourceRemove({ $entry: entry }).then(function() {
            list();
            $scope.onRemove(entry.id);
          });
        }

        function list() {
          $scope.error = false;
          return $scope.hcSource().then(function(data) {
            $scope.model = data;
            $scope.meta = data.map(function() { return {} });
            self.length = data.length;
          }).catch(function() {
            $scope.error = true;
          });
        }
      },
    };
  });
});
