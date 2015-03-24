define(function(require) {
  'use strict';
  require('components/directive-experience-form/directive-experience-form');
  require('components/directive-education-form/directive-education-form');
  require('components/directive-languages-form/directive-languages-form');
  require('components/directive-skills-form/directive-skills-form');
  require('components/element-preferred-location/element-preferred-location');
  require('components/element-candidate-status/element-candidate-status');
  require('./avatar/avatar');
  require('./avatar/avatar-edit');
  require('./salary/salary');
  require('./salary/salary-edit');

  var _ = require('underscore');
  var fn = require('tools/fn');
  var Date = require('tools/date');
  var module = require('app-module');

  // jshint maxstatements:50, maxparams:10
  module.controller('ProfileCtrl', function($scope, $q, $state, toaster, i18n,
                                            Amazon, Loader, ConfigAPI, Permission, Session) {

    var ctrl = this;
    _.extend(this, {
      edit: edit,
      stopEdit: stopEdit,
      openForm: openForm,
      closeForm: closeForm,
      update: update,
      isFormOpen: false,
    });

    onLoad();


    function onLoad() {

    }

    function edit() {
      $scope.isEditing = true;
    }

    function stopEdit() {
      $scope.isEditing = false;
      closeForm();
    }

    function openForm(id) {
      $scope.editClass = 'editing-' + id;
      ctrl.isFormOpen = true;
    }

    function closeForm() {
      $scope.editClass = '';
      ctrl.isFormOpen = false;
    }

    function update() {
      return refresh();
    }



    $scope.locationToText = ConfigAPI.locationToText;
    $scope.searchCities = ConfigAPI.locations;
    $scope.sendCompletion = sendCompletion;
    $scope.isEditing = false;
    $scope.starValues = [ null, 'basic', 'advanced', 'expert' ];
    Loader.page(true);


    var PICK_CONTACT_DATA_FIELDS = function(obj){
      return _.pick(obj, 'contact_line1', 'contact_line2', 'contact_phone',
        'contact_skype', 'contact_zipcode', 'email', 'github_url',
        'location', 'pob', 'stackoverflow_url', 'blog_url');
    };

    ConfigAPI.featuredLocations()
      .then(toCheckboxModel('featuredLocations'));
    ConfigAPI.featuredRoles()
      .then(fn.setTo('featuredRoles', $scope));
    ConfigAPI.countries({ limit: 500 })
      .then(fn.setTo('countries', $scope));

    Permission.requireLogged()
      .then(refresh)
      .finally(function() { Loader.page(false) });


    $scope.cv = form({
      source: function(user) {
        return user.getData().then(function(data) {
          $scope.user = data;
          return data.cv_upload_url;
        });
      },
      save: function(files) {
        if (!files || !files.length) return;
        return Session.getUser().then(function(user) {
          return Amazon.upload(files[0], 'cv', Session.id())
            .then(user.setCVUrl.bind(user))
            .then(toaster.success.bind(toaster, i18n.gettext('CV Uploaded')));
        }.bind(this));
      },
    });
    $scope.privacy = form({
      source: function(user) {
        return user.getData().then(function(data) {
          $scope.user = data;
          return _.pick(data, 'anonymous', 'sleeping');
        });
      },
      save: function(model, form, user) {
        return user.updateData(model);
      }
    });
    $scope.name = form({
      source: function(user) {
        return user.getData().then(function(data) {
          $scope.user = data;
          return _.pick(data, 'first_name', 'last_name');
        });
      },
      save: function(model, form, user) {
        return user.updateData(model);
      }
    });
    $scope.contact = form({
      source: function(user) {
        return user.getData().then(function(data) {
          $scope.user = data;
          return PICK_CONTACT_DATA_FIELDS(data);
        });
      },
      save: function(model, form, user) {
        return user.updateData(model);
      }
    });
    $scope.targetPosition = form({
      source: function(user) {
        return user.getTargetPosition();
      },
      save: function(model, form, user) {
        return user.setTargetPosition(model);
      }
    });
    $scope.summary = form({
      source: function(user) {
        return user.getData().then(function(data) {
          $scope.user = data;
          return data.summary;
        });
      },
      save: function(model, form, user) {
        return user.updateData({ summary: model });
      }
    });
    $scope.dob = form({
      source: function(user) {
        return user.getData().then(function(data) {
          $scope.user = data;
          return {
            dob: Date.parse(data.dob),
            eu_work_visa: data.eu_work_visa,
          };
        });
      },
      save: function(model, form, user) {
        var offset = model.dob.getTimezoneOffset() / 60;
        model.dob.setHours(-offset);
        return user.updateData(model);
      }
    });
    $scope.availability = form({
      source: function(user) {
        return user.getData().then(function(data) {
          $scope.user = data;
          return data.availability;
        });
      },
      save: function(model, form, user) {
        return user.updateData({ availability: model });
      }
    });

    function refreshSkills(skills){
      var leveledSkills = skills.filter(fn.get('level'));
      var unleveledSkills = skills.filter(fn.not(fn.get('level')));
      $scope.leveledSkills = leveledSkills.slice(0, 9);
      $scope.unleveledSkills = leveledSkills.slice(9)
        .concat(unleveledSkills)
        .map(fn.get('skill'))
        .join(', ');
    }

    $scope.skills = formDirective({
      source: function(user) {
        return user.getData().then(function(data) {
          $scope.user = data;
          refreshSkills(data.skills);
          return data.skills;
        });
      }
    });
    $scope.languages = formDirective({
      source: function(user) {
        return user.getData().then(function(data) {
          $scope.user = data;
          return data.languages;
        });
      }
    });
    var experience = $scope.experience = listForm({
      source: function(user) {
        return user.getExperience().then(function(list) {
          var total = 0;
          var timeline = list.map(function(entry) {
            var start = Date.parse(entry.start);
            var end = entry.end ? Date.parse(entry.end) : Date.now();
            var duration = end - start;
            total += duration;
            return {
              start: start,
              duration: duration,
              role: entry.role
            };
          }).filter(function(entry) {
            return entry.duration !== 0;
          });
          timeline.forEach(function(entry) {
            entry.percent = 100 / total * entry.duration;
          });
          $scope.totalWorkExperience = total;
          $scope.timeline = timeline.sort(function(a, b) {
            return a.start - b.start;
          });
          return list;
        });
      }
    });
    var education = $scope.education = listForm({
      source: function(user) {
        return user.getEducation();
      }
    });


    function refresh() {
      return Session.getUser().then(function(user) {
        $scope.candidate = user;
        return $q.all([
          user.getData(),
          user.getTargetPosition(),
          user.getOffers(),
          user.getHighestDegree(),
          experience.refresh(),
          education.refresh(),
          updateCompletionStage(),
        ]);
      }).then(function(data) {
        var user = data[0];
        $scope.allOffers = data[2];
        $scope.offers = data[2]
          .sort(function(a, b) { return b.data.annual_salary - a.data.annual_salary })
          .slice(0, 3);

        $scope.highestDegree = data[3];
        $scope.targetPosition.data = data[1];
        $scope.skills.data = user.skills;
        refreshSkills(user.skills);

        $scope.privacy.data = _.pick(user, 'anonymous', 'sleeping');
        $scope.languages.data = user.languages;
        $scope.summary.data = user.summary;
        $scope.cv.data = user.cv_upload_url;
        $scope.user = user;
        $scope.name.data = _.pick(user, 'first_name', 'last_name', 'anonymous');
        $scope.contact.data = PICK_CONTACT_DATA_FIELDS(user);
        $scope.dob.data = {
          dob: user.dob && Date.parse(user.dob),
          eu_work_visa: user.eu_work_visa
        };
        $scope.ready = true;

        function translate() {
          $scope.lang = i18n.getCurrent();
        }
        i18n.onChange(translate);
        translate();
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
          return Session.getUser()
            .then(options.save.bind(options, model, form))
            .then(this.refresh.bind(this))
            .then(this.close.bind(this))
            .finally(function() {
              $scope.loading = false;
              Loader.remove('profile');
            });
        },
        edit: function() {
          if (options.edit)
            options.edit(this.data);
          this.editing = true;
          $scope.formOpen = true;
        },
        close: function() {
          this.editing = false;
          $scope.formOpen = false;
        },
      };
    }

    function formDirective(options) {
      return form({
        source: options.source,
        save: function(model, form) {
          return form.save();
        }
      });
    }

    function listForm(options) {
      var base = formDirective(options);
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
        }
      });
    }


    function toCheckboxModel(key) {
      return function(data) {
        $scope[key] = data.map(function(type) {
          return { value: type };
        });
      };
    }
  });


  return {
    url: '/profile/',
    template: require('text!./candidate-profile.html'),
    controller: 'ProfileCtrl',
    controllerAs: 'profile'
  };
});
