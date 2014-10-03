define(function(require) {
  'use strict';
  require('session');
  require('tools/file-upload/amazon');
  require('tools/file-upload/data-url-directive');
  require('tools/file-upload/file-select-directive');
  var nameAttr = require('tools/name-attr');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.directive('hcProfileForm', function() {
    return {
      restrict: 'EA',
      scope: {
        //model: '=ngModel',
        onSubmit: '&',
        hcShowEmpty: '=',
        hcDisabled: '=',
      },
      transclude: true,
      template: require('text!./directive-profile-form.html'),
      controllerAs: 'skillsCtrl',
      controller: function($scope, $attrs, ConfigAPI, Session, Amazon) {
        $scope.selectFile = selectFile;
        $scope.submit = submit;
        this.setModel = setModel;
        this.reset = reset;
        this.save = save;

        nameAttr(this, 'hcProfileForm', $scope, $attrs);
        ConfigAPI.countries({ limit: 500 }).then(fn.setTo('countries', $scope));

        function save() {
          return Session.getUser().then(function(user) {
            return user.updateData($scope.model).then(function() {
              if ($scope.model.picture_url)
                return;

              return Amazon.upload($scope.files[0], 'users', Session.id()).then(function(file) {
                return user.setPhoto(file);
              });
            });
          });
        }

        function reset() {
          $scope.formProfile.$setPristine();
          $scope.model = {};
        }

        function setModel(model) {
          $scope.model = JSON.parse(JSON.stringify(model));
          $scope.selectedFiles = [ model.picture_url ];
        }

        function selectFile(files) {
          $scope.model.picture_url = null;
          $scope.errorFileRequired = !files.length;
          if (files.length)
            $scope.errorFileImage = files[0].type.indexOf('image/') !== 0;
        }

        function submit() {
          if ((!$scope.files || !$scope.files.length) && !$scope.model.picture_url) {
            $scope.errorFileRequired = true;
            return;
          }

          if ($scope.errorFileImage)
            return;

          $scope.onSubmit({ $model: $scope.model });
        }
      },
    };
  });
});
