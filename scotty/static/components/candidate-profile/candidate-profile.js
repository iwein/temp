define(function(require) {
  'use strict';
  require('components/directive-experience-form/directive-experience-form');
  require('components/directive-education-form/directive-education-form');
  require('components/element-preferred-location/element-preferred-location');
  require('components/element-candidate-status/element-candidate-status');
  require('./availability/availability');
  require('./availability/availability-edit');
  require('./avatar/avatar');
  require('./avatar/avatar-edit');
  require('./birthdate/birthdate');
  require('./birthdate/birthdate-edit');
  require('./contact/contact');
  require('./contact/contact-edit');
  require('./cv/cv');
  require('./cv/cv-edit');
  require('./languages/languages');
  require('./languages/languages-edit');
  require('./name/name');
  require('./name/name-edit');
  require('./offers/offers');
  require('./privacy/privacy');
  require('./privacy/privacy-edit');
  require('./salary/salary');
  require('./salary/salary-edit');
  require('./skills/skills');
  require('./skills/skills-edit');
  require('./summary/summary');
  require('./summary/summary-edit');
  require('./target/target');
  require('./target/target-edit');

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

    Permission.requireLogged()
      .then(refresh)
      .finally(function() { Loader.page(false) });


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
        $scope.skills.data = user.skills;
        refreshSkills(user.skills);
        $scope.user = user;
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
  });


  return {
    url: '/profile/',
    template: require('text!./candidate-profile.html'),
    controller: 'ProfileCtrl',
    controllerAs: 'profile'
  };
});
