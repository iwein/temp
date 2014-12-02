define(function(require) {
  'use strict';
  require('session');
  var nameAttr = require('tools/name-attr');
  var module = require('app-module');

  module.directive('hcEducation', function() {
    return {
      restrict: 'EA',
      scope: {
        hcTitle: '@',
        onAdd: '&',
        onLoad: '&',
        onEdit: '&',
        onRemove: '&',
        onImportChange: '&',
        hcSource: '&',
        hcSourceRemove: '&',
        hcEditable: '=',
        hcRemoveLast: '=',
        hcAutomaticAdd: '=',
      },
      template: require('text!./directive-education.html'),
      controllerAs: 'hcEducationCtrl',
      controller: function($scope, $attrs) {
        var self = this;
        $scope.edit = edit;
        $scope.remove = remove;
        $scope.submit = submit;
        $scope.importChange = importChange;
        $scope.formContainer = {};
        $scope.active = -1;
        this.setAdding = setAdding;
        this.setActive = setActive;
        this.refresh = list;

        nameAttr(this, 'hcEducation', $scope, $attrs);
        list().then(function() {
          $scope.onLoad();
        });

        function importChange() {
          $scope.onImportChange({ $list: $scope.model });
        }

        function setAdding(value) {
          setActive(-1);
          $scope.adding = value;
        }

        function setActive(index) {
          if ($scope.formContainer.form)
            $scope.formContainer.form.reset();

          $scope.active = index;
          $scope.editing = index !== -1;
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
            self.length = data.length;
          }).catch(function() {
            $scope.error = true;
          });
        }
      },
    };
  });
});
