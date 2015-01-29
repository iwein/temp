define(function(require) {
  'use strict';
  require('components/directive-office-form/directive-office-form');
  var _ = require('underscore');
  var nameAttr = require('tools/name-attr');
  var module = require('app-module');

  module.directive('hcOffices', function(Session) {
    return {
      restrict: 'EA',
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
      template: require('text!./directive-offices.html'),
      controllerAs: 'hcOfficesCtrl',
      controller: function($scope, $attrs) {
        var self = this;
        $scope.remove = remove;
        $scope.submit = submit;
        $scope.formContainer = {};
        $scope.active = -1;
        this.setActive = setActive;
        this.refresh = list;

        nameAttr(this, 'hcOffices', $scope, $attrs);
        list().then(function() {
          $scope.onLoad();
        });

        Session.getUser().then(function(user) {
          return user && user.getData();
        }).then(function(data) {
          var prefill = _.pick(data, [
            'contact_first_name',
            'contact_last_name',
            'contact_salutation',
            'address_city',
          ]);
          prefill.contact_email = data.email;

          $scope.$watch('::formContainer.form', function(value) {
            value.setModel(prefill);
          });
        });

        function setActive(index, entry) {
          var form = $scope.formContainer.form;
          $scope.active = index;
          $scope.editing = index !== -1;

          if (form) {
            if ($scope.editing)
              form.setModel(entry);
            else
              form.reset();
          }
        }

        function submit(model, form) {
          var data = {
            $entry: model,
            $form: form,
          };

          return ($scope.active === -1 ?
            $scope.onAdd(data) :
            $scope.onEdit(_.extend(data, { $index: $scope.active }))
          ).then(function() {
            if ($scope.formContainer.form)
              $scope.formContainer.form.reset();

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
