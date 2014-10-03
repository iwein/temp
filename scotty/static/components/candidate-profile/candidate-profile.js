define(function(require) {
  'use strict';
  require('components/directive-target-positions/directive-target-positions');
  require('components/directive-experience/directive-experience');
  require('components/directive-education/directive-education');
  var _ = require('underscore');
  var module = require('app-module');

  module.controller('ProfileCtrl', function($scope, $state, Permission, Session) {
    this.edit = edit;
    this.stopEdit = stopEdit;
    $scope.ready = false;
    $scope.isEditing = false;

    function edit() {
      $scope.isEditing = true;
    }
    function stopEdit() {
      $scope.isEditing = false;
    }

    function defaultForm() {
      return {
        // injected by directives
        form: null,
        editing: false,
        edit: function(model) {
          this.form.setModel(model);
          this.editing = true;
        },
        cancel: function() {
          this.form.reset();
          this.editing = false;
        },
        save: function() {
          return this.form.save().then(function() {
            this.editing = false;
          }.bind(this));
        }
      };
    }

    function listForm() {
      var base = defaultForm();
      return _.extend(Object.create(base), {
        list: null,
        add: function() {
          this.editing = true;
        },
        cancel: function() {
          base.cancel.call(this);
          return this.list.refresh();
        },
        save: function() {
          return base.save.call(this).then(function() {
            return this.list.refresh();
          }.bind(this));
        },
      });
    }

    $scope.experience = listForm();
    $scope.education = listForm();
    $scope.targetPosition = (function() {
      var base = listForm();
      return _.extend(Object.create(base), {
        edit: function(model) {
          model.preferred_locations = $scope.cities;
          return base.edit.call(this, model);
        },
      });
    })();


    //Permission.requireSignup().then(function() {
    Permission.requireLogged().then(function() {
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
