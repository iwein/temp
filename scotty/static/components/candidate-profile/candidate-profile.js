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
    this.edit = function() { $scope.isEditing = true };
    this.stopEdit = function() { $scope.isEditing = false };
    $scope.isEditing = true;
    $scope.starValues = [ null, 'basic', 'advanced', 'expert' ];
    Loader.page(true);


    Permission.requireActivated()
      .then(refresh)
      .finally(function() { Loader.page(false) });


    $scope.skills = form({
      source: function(user) {
        return user.getData().then(function(data) {
          return data.skills;
        });
      },
    });
    $scope.languages = form({
      source: function(user) {
        return user.getData().then(function(data) {
          return data.languages;
        });
      },
    });
    var experience = $scope.experience = listForm({
      source: function(user) {
        return user.getExperience();
      },
    });
    var education = $scope.education = listForm({
      source: function(user) {
        return user.getEducation();
      },
    });


    function refresh() {
      return Session.getUser().then(function(user) {
        return $q.all([
          user.getData(),
          user.getTargetPosition(),
          experience.refresh(),
          education.refresh(),
        ]);
      }).then(function(data) {
        var user = data[0];
        $scope.targetPosition = data[1];
        $scope.skills.data = user.skills;
        $scope.languages.data = user.languages;
        $scope.cities = user.preferred_location;
        $scope.user = user;
        $scope.ready = true;
      });
    }

    function form(options) {
      return {
        editing: false,
        refresh: function() {
          return Session.getUser()
            .then(options.source)
            .then(function(data) { this.data = data }.bind(this))
            .finally(function() { Loader.remove('profile') });
        },
        save: function(model, form) {
          $scope.loading = true;
          Loader.add('profile');
          return form.save()
            .then(this.refresh.bind(this))
            .then(this.close.bind(this))
            .finally(function() {
              $scope.loading = false;
              Loader.remove('profile');
            });
        },
        edit: function() {
          this.editing = true;
          $scope.formOpen = true;
        },
        close: function() {
          this.editing = false;
          $scope.formOpen = false;
        },
      };
    }

    function listForm(options) {
      var base = form(options);
      return _.extend({}, base, {
        editing: -1,
        add: function() {
          this.form.reset();
          this.editing = -2;
          $scope.formOpen = true;
        },
        edit: function(model, index) {
          this.editing = index;
          $scope.formOpen = true;
        },
        close: function() {
          this.editing = -1;
          $scope.formOpen = false;
        },
      });
    }






    /*
    $scope.sendCompletion = sendCompletion;
    $scope.ready = false;
    $scope.loading = false;

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
    */
  });


  return {
    url: '/profile/',
    template: require('text!./candidate-profile.html'),
    controller: 'ProfileCtrl',
    controllerAs: 'profile',
  };
});
