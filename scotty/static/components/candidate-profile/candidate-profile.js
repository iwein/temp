define(function(require) {
  'use strict';
  require('components/directive-target-position-form/directive-target-position-form');
  require('components/directive-experience-form/directive-experience-form');
  require('components/directive-experience/directive-experience');
  require('components/directive-education-form/directive-education-form');
  require('components/directive-education/directive-education');
  require('components/directive-languages-form/directive-languages-form');
  require('components/directive-profile-form/directive-profile-form');
  require('components/directive-skills-form/directive-skills-form');
  var _ = require('underscore');
  var module = require('app-module');

  module.controller('ProfileCtrl', function($scope, $q, $state, Loader, Permission, Session) {
    this.edit = edit;
    this.stopEdit = stopEdit;
    $scope.sendCompletion = sendCompletion;
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
          $scope.formOpen = true;
        },
        cancel: function() {
          this.form.reset();
          this.editing = false;
          $scope.formOpen = false;
        },
        save: function() {
          $scope.loading = true;
          Loader.add('candidate-profile-saving');
          return this.form.save()
            .then(function() {
              this.editing = false;
              $scope.formOpen = false;
            }.bind(this))
            .finally(function() { $scope.loading = false });
        }
      };
    }

    function listForm() {
      return {
        save: function(edit, form) {
          Loader.add('candidate-profile-saving');
          return form.save().then(function() {
            return this.list.refresh();
          }.bind(this)).finally(function() {
            Loader.remove('candidate-profile-saving');
          });
        }
      };
    }

    $scope.experience = listForm();
    $scope.education = listForm();

    $scope.targetPositionForm = (function() {
      var base = defaultForm();
      return _.extend(Object.create(base), {
        forceEdit: function() {
          this.list.forceEdit(0);
        },
        edit: function(model, cities) {
          model.preferred_locations = cities;
          return base.edit.call(this, model);
        },
        save: function() {
          return base.save.call(this).then(function() {
            return Session.getUser();
          }).then(function(user) {
            return $q.all([
              user.getData(),
              user.getTargetPosition(),
            ]);
          }).then(function(data) {
            var user = data[0];
            $scope.targetPosition = data[1];
            $scope.cities = user.preferred_location;
          }).finally(function() {
            Loader.remove('candidate-profile-saving');
          });
        },
      });
    })();

    $scope.skillsForm = (function() {
      var base = defaultForm();
      return _.extend(Object.create(base), {
        save: function() {
          return base.save.call(this)
            .then(getUserData)
            .then(function(data) { $scope.skills = data.skills })
            .finally(function() { Loader.remove('candidate-profile-saving') });
        }
      });
    })();

    $scope.languagesForm = (function() {
      var base = defaultForm();
      return _.extend(Object.create(base), {
        save: function() {
          return base.save.call(this)
            .then(getUserData)
            .then(function(data) { $scope.languages = data.languages })
            .finally(function() { Loader.remove('candidate-profile-saving') });
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
            .then(function(data) { $scope.user = data })
            .finally(function() { Loader.remove('candidate-profile-saving') });
        }
      });
    })();


    Permission.requireSignup()
      .then(refresh)
      .finally(function() { Loader.page(false) });

    function refresh() {
      return $q.all([
        updateData(),
        updateCompletionStage(),
      ]);
    }

    function updateData() {
      return Session.getUser().then(function(user) {
        return $q.all([
          user.getData(),
          user.getTargetPosition(),
        ]);
      }).then(function(data) {
        var user = data[0];
        $scope.targetPosition = data[1];
        $scope.cities = user.preferred_location;
        $scope.languages = user.languages;
        $scope.skills = user.skills;
        $scope.user = user;
        $scope.ready = true;
      });
    }

    function sendCompletion(model) {
      Loader.add('profile-completion');
      return Session.getUser()
        .then(function(user) { return user.updateData(model) })
        .then(refresh)
        .finally(function() { Loader.remove('profile-completion') });
    }

    function updateCompletionStage() {
      return Session.getCompletionStage().then(function(result) {
        $scope.completionStage = result;
      });
    }

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
