define(function(require) {
  'use strict';
  require('session');
  require('tools/file-upload/amazon');
  require('tools/file-upload/data-url-directive');
  require('tools/file-upload/file-select-directive');
  var nameAttr = require('tools/name-attr');
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
      controller: function($scope, $q, $attrs, ConfigAPI, Session, Amazon) {
        $scope.searchLocations = ConfigAPI.locationsText;
        $scope.setLocation = setLocation;
        $scope.selectFile = selectFile;

        var d = new Date();
        d.setFullYear(d.getFullYear() - 16);
        $scope.minBirthDay = d.toISOString().split('T')[0];

        $scope.submit = submit;
        $scope.errorNoLocation = false;
        $scope.model = { eu_work_visa: true };
        this.setModel = setModel;
        this.reset = reset;
        this.save = save;

        nameAttr(this, 'hcProfileForm', $scope, $attrs);

        function setLocation(text) {
          $scope.model.location = ConfigAPI.getLocationFromText(text);
          $scope.errorNoLocation = !$scope.model.location;
        }

        function save() {
          return Session.getUser().then(function(user) {
            return user.updateData($scope.model).then(function() {
              var promises = [];

              if ($scope.files && $scope.files.length) {
                promises.push(Amazon.upload($scope.files[0], 'users', Session.id())
                  .then(user.setPhoto.bind(user)));
              }

              if ($scope.cv_file && $scope.cv_file.length) {
                promises.push(Amazon.upload($scope.cv_file[0], 'cv', Session.id())
                  .then(user.setCVUrl.bind(user)));
              }

              return $q.all(promises);
            });
          });
        }

        function reset() {
          $scope.formProfile.$setPristine();
          $scope.model = { eu_work_visa: true };
        }

        function setModel(model) {
          $scope.model = JSON.parse(JSON.stringify(model));
          $scope.selectedFiles = [ model.picture_url ];

          Object.keys($scope.model).forEach(function(key) {
            if ($scope.model[key] == null)
              delete $scope.model[key];
          });

          if ('dob' in $scope.model)
            $scope.model.dob = new Date($scope.model.dob);
          if (!('eu_work_visa' in $scope.model))
            $scope.model.eu_work_visa = true;
        }

        function selectFile(files) {
          $scope.model.picture_url = null;
          if (files.length)
            $scope.errorFileImage = files[0].type.indexOf('image/') !== 0;
        }

        function submit() {
          if (!$scope.model.location) {
            $scope.locationFocus = true;
            $scope.errorNoLocation = true;
          }

          if ($scope.errorNoLocation) {
            $scope.formProfile.location.$dirty = true;
            return;
          }

          if ($scope.formProfile.birth.$invalid){
            $scope.dobFocus = true;
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
