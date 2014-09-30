define(function(require) {
  'use strict';
  require('components/directive-target-positions/directive-target-positions');
  require('components/directive-experience/directive-experience');
  require('components/directive-education/directive-education');
  var module = require('app-module');

  module.controller('ProfileCtrl', function($scope, $state, Permission, Session) {
    this.edit = edit;
    $scope.ready = false;
    $scope.isEditing = false;

    function edit() {
      $scope.isEditing = true;
    }

    function defaultForm() {
      var self = {
        // injected by the directive
        form: null,
        editing: false,
        edit: function(model) {
          self.form.setModel(model);
          self.editing = true;
        },
        cancel: function() {
          self.form.reset();
          self.editing = false;
        },
        save: function() {
          self.form.save().then(function() {
            self.editing = false;
          });
        }
      };
      return self;
    }

    $scope.education = defaultForm();

    Permission.requireSignup().then(function() {
      return Session.getUser();
    }).then(function(user) {
      return user.getData();
    }).then(function(data) {
      $scope.ready = true;
      $scope.cities = data.preferred_location;
      $scope.languages = data.languages;
      $scope.skills = data.skills;
      $scope.user = data;
    });
  });


  return {
    url: '/profile/',
    template: require('text!./candidate-profile.html'),
    controller: 'ProfileCtrl',
    controllerAs: 'profile',
  };
});
