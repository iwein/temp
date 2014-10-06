define(function(require) {
  'use strict';
  require('components/directive-target-position-form/directive-target-position-form');
  require('components/directive-target-positions/directive-target-positions');
  require('components/directive-experience-form/directive-experience-form');
  require('components/directive-experience/directive-experience');
  require('components/directive-education-form/directive-education-form');
  require('components/directive-education/directive-education');
  require('components/directive-languages-form/directive-languages-form');
  require('components/directive-profile-form/directive-profile-form');
  require('components/directive-skills-form/directive-skills-form');
  var _ = require('underscore');
  var module = require('app-module');

  module.controller('ProfileCtrl', function($scope, $state, Loader, Permission, Session) {
    this.edit = edit;
    this.stopEdit = stopEdit;
    $scope.ready = false;
    $scope.loading = false;
    $scope.isEditing = false;
    Loader.page(true);

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
        forceEdit: function() {
          this.list.forceEdit(0);
        },
        edit: function(model) {
          model.preferred_locations = $scope.cities;
          return base.edit.call(this, model);
        },
        save: function() {
          return base.save.call(this)
            .then(getUserData)
            .then(function(data) { $scope.cities = data.preferred_location });
        },
      });
    })();

    $scope.skillsForm = (function() {
      var base = defaultForm();
      return _.extend(Object.create(base), {
        save: function() {
          return base.save.call(this)
            .then(getUserData)
            .then(function(data) { $scope.skills = data.skills });
        }
      });
    })();

    $scope.languagesForm = (function() {
      var base = defaultForm();
      return _.extend(Object.create(base), {
        save: function() {
          return base.save.call(this)
            .then(getUserData)
            .then(function(data) { $scope.languages = data.languages });
        }
      });
    })();

    $scope.profileForm = (function() {
      var base = defaultForm();
      return _.extend(Object.create(base), {
        edit: function(model) {
          return base.edit.call(this, _.omit(model, [
            'skills',
            'languages',
            'preferred_location',
            'work_experience',
            'activation_token',
            'status',
          ]));
        },
        save: function() {
          return base.save.call(this)
            .then(getUserData)
            .then(function(data) { $scope.user = data });
        }
      });
    })();


    //Permission.requireSignup().then(function() {
    Permission.requireLogged()
      .then(getUserData)
      .then(function(data) {
        $scope.ready = true;
        $scope.cities = data.preferred_location;
        $scope.languages = data.languages;
        $scope.skills = data.skills;
        $scope.user = data;
      })
      .finally(function() { Loader.page(false) });

    function getUserData() {
      return Session.getUser().then(function(user) {
        return user.getData();
      });
    }
  });


  return {
    url: '/profile/',
    template: require('text!./candidate-profile.html'),
    controller: 'ProfileCtrl',
    controllerAs: 'profile',
  };
});
