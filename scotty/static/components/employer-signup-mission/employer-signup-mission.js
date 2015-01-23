define(function(require) {
  'use strict';
  require('textangular');
  require('session');
  var _ = require('underscore');
  var module = require('app-module');

  module.directive('onFile', function($parse) {
    return {
      restrict: 'A',
      link: function(scope, elem, attr) {
        var element = elem[0];
        var pattern = new RegExp(attr.onFilePattern);
        var submit = $parse(attr.onFile || attr.handler);
        var preventDef = 'onFilePreventDefault' in attr;

        function complete(event, locals) {
          if (preventDef) {
            event.stopPropagation();
            event.preventDefault();
          }

          submit(scope, locals);
        }

        element.addEventListener('paste', function(event) {
          var clipboard = event && event.clipboardData;
          if (!clipboard || !clipboard.getData)
            return;

          if (clipboard.files.length) {
            var files = [].filter.call(clipboard.files, function(file) {
              return pattern.test(file.type);
            });

            if (files.length)
              complete(event, { $files: files });
          }

          /*
          This just prints the file format icon

          [].some.call(clipboard.types, function(type, index) {
            var item = clipboard.files[index];

            if (pattern.test(type) || pattern.test(item.type)) {
              file = item.getAsFile();
              return true;
            }
          });


          if (file)
            submit(scope, { $file: file });
          */
        }, true);
      }
    };
  });

  module.controller('SignupMissionCtrl', function($scope, toaster, Amazon, Loader, Session) {
    this.submit = submit;
    $scope.error = false;
    $scope.loading = true;
    $scope.missionDirty = false;
    $scope.model = {};
    Loader.page(true);


    // Angular HACK! There is no way to modify textangular content but editing the HTML itself
    function setMissionText(value) {
      document.querySelector('text-angular [contenteditable]').innerHTML = value;
    }

    $scope.onFile = function(files) {
      // TODO: support multiple files
      var file = files[0];

      var id = 'IMAGE-' + Math.round(Math.random() * 1000000) + '.' + file.type.split('/')[1];
      var token = '[uploading file ' + id + '...]';
      var original = $scope.model.mission_text;
      var mission = $scope.model.mission_text + token;
      setMissionText(mission);

      return Amazon.upload(file, 'employer-photos/' + Session.id(), id).then(function(url) {
        if ($scope.model.mission_text !== original)
          mission = $scope.model.mission_text;
        setMissionText(mission.replace(token, '<img width="50px" height="50px" src="' + url + '">'));
      });
    };


    $scope.$watch('model.mission_text', function(value) {
      $scope.errorMissionEmpty = !value;
      $scope.missionDirty = $scope.missionDirty || !!value;
    });

    Session.getUser().then(function(user) {
      return user && user.getData();
    }).then(function(data) {
      $scope.model = _.pick(data, [
        'founding_year',
        'revenue_pa',
        'funding_amount',
        'no_of_employees',
        'mission_text',
      ]);
    }).finally(function() {
      $scope.loading = false;
      Loader.page(false);
    });

    function submit() {
      if ($scope.errorMissionEmpty) {
        $scope.missionDirty = true;
        return;
      }

      Object.keys($scope.model).forEach(function(key) {
        if (!$scope.model[key])
          delete $scope.model[key];
      });

      $scope.loading = true;
      Loader.add('signup-mission-saving');

      Session.user.updateData($scope.model).then(function() {
        $scope.signup.nextStep();
      }).catch(function() {
        toaster.defaultError();
      }).finally(function() {
        $scope.loading = false;
        Loader.remove('signup-mission-saving');
      });
    }
  });

  return {
    url: '/mission/',
    template: require('text!./employer-signup-mission.html'),
    controller: 'SignupMissionCtrl',
    controllerAs: 'signupMission',
  };
});


