define(function(require) {
  'use strict';
  require('components/directive-target-position-form/directive-target-position-form');
  require('components/directive-target-positions/directive-target-positions');
  require('components/directive-experience-form/directive-experience-form');
  require('components/directive-experience/directive-experience');
  require('components/directive-education-form/directive-education-form');
  require('components/directive-education/directive-education');
  require('components/directive-skills-form/directive-skills-form');
  var _ = require('underscore');
  var module = require('app-module');

  module.controller('ProfileCtrl', function($scope, $state, Permission, Session) {
    this.edit = edit;
    this.stopEdit = stopEdit;
    $scope.ready = false;
    $scope.loading = false;
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
          $scope.loading = true;
          return this.form.save().then(function() {
            $scope.loading = false;
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

    $scope.skillsForm = (function() {
      var base = defaultForm();
      return _.extend(Object.create(base), {
        save: function() {
          return base.save.call(this).then(function() {
            return Session.getUser();
          }).then(function(user) {
            return user.getData();
          }).then(function(data) {
            $scope.skills = data.skills;
          });
        }
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
