define(function(require) {
  'use strict';
  require('angular-sanitize');
  require('components/directive-office/directive-office');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');


  module.controller('ProfileCtrl', function($scope, $sce, $state, Loader, ConfigAPI, Permission, Session) {
    this.edit = function() { $scope.isEditing = true };
    this.stopEdit = function() { $scope.isEditing = false };
    $scope.searchTags = ConfigAPI.skills;
    $scope.toggle = toggle;
    $scope.ready = false;
    Loader.page(true);
    var benefits;


    ConfigAPI.benefits().then(function(response) { benefits = response });
    $scope.$watch('company.data.mission_text', function(value) {
      $scope.errorMissionEmpty = !value;
      $scope.missionDirty = $scope.missionDirty || !!value;
    });



    $scope.summary = formSimple({
      set: function(data) {
        $scope.data = data;
        return { summary: data.summary };
      },
      save: function(model, form, user) {
        return user.updateData(model);
      }
    });
    $scope.tech = formSimple({
      set: function(data) {
        $scope.data = data;
        return _.pick(data, 'tech_team_size', 'tech_tags');
      },
      save: function(model, form, user) {
        return user.updateData(model);
      }
    });
    $scope.descriptions = formSimple({
      set: function(data) {
        $scope.data = data;
        return _.pick(data, 'tech_team_philosophy', 'recruitment_process',
          'training_policy');
      },
      save: function(model, form, user) {
        return user.updateData(model);
      }
    });
    $scope.company = formSimple({
      set: function(data) {
        $scope.data = data;
        $scope.missionDirty = false;
        return _.pick(data, 'website', 'funding_year', 'revenue_pa',
          'funding_amount', 'no_of_employees', 'mission_text');
      },
      save: function(model, form, user) {
        if ($scope.errorMissionEmpty) return;
        return user.updateData(model);
      }
    });
    $scope.benefits = formSimple({
      set: function(data) {
        $scope.data = data;
        return benefits.map(function(value) {
          return {
            value: value,
            selected: data.benefits.indexOf(value) !== -1
          };
        });
      },
      save: function(model, form, user) {
        var values = model.filter(fn.get('selected')).map(fn.get('value'));
        return user.updateData({ benefits: values });
      }
    });
    $scope.webProfiles = formSimple({
      set: function(data) {
        $scope.data = data;
        return _.pick(data, 'fb_url', 'linkedin_url');
      },
      save: function(model, form, user) {
        return user.updateData(model);
      }
    });
    $scope.offices = listForm({
      set: function(data) {
        $scope.data = data;
        return data.offices;
      }
    });


    Permission.requireActivated()
      .then(refresh)
      .finally(function() { Loader.page(false) });


    function refresh() {
      return Session.getUser().then(function(user) {
        return user.getData();
      }).then(function(data) {
        $scope.ready = true;
        if (data.status === 'APPROVED')
          $scope.approved = true;

        $scope.data = data;
        $scope.summary.set(data);
        $scope.tech.set(data);
        $scope.descriptions.set(data);
        $scope.company.set(data);
        $scope.benefits.set(data);
        $scope.webProfiles.set(data);
        $scope.offices.set(data);
      });
    }

    function form(options) {
      return {
        editing: false,
        refresh: function() {
          return Session.getUser()
            .then(options.source.bind(this))
            .then(function(data) { this.data = data }.bind(this))
            .finally(function() { Loader.remove('profile') });
        },
        set: function(data) {
          this.data = options.set.call(this, data);
          return this.data;
        },
        _clean: function(model) {
          Object.keys(model).forEach(function(key) {
            if (!model[key]) delete model[key];
          });
          return model;
        },
        save: function(model, form) {
          $scope.loading = true;
          Loader.add('profile');
          model = this._clean(model);

          return Session.getUser()
            .then(options.save.bind(this, model, form))
            .then(this.refresh.bind(this))
            .then(this.close.bind(this))
            .finally(function() {
              $scope.loading = false;
              Loader.remove('profile');
            });
        },
        edit: function() {
          if (options.edit)
            options.edit.call(this, this.data);
          this.editing = true;
          $scope.formOpen = true;
        },
        close: function() {
          this.editing = false;
          $scope.formOpen = false;
        },
      };
    }

    function formSimple(options) {
      return form(_.extend(options, {
        source: function(user) {
          return user.getData().then(this.set.bind(this));
        }
      }));
    }


    function listForm(options) {
      var base = formSimple(_.extend(options, {
        save: function(model, form) {
          return form.save();
        },
      }));
      return _.extend({}, base, {
        editing: -1,
        _clean: function(model) {
          return model;
        },
        add: function() {
          this.form.reset();
          this.editing = -2;
          $scope.formOpen = true;
        },
        edit: function(model, index) {
          this.editing = this.editing === index ? -1 : index;
          $scope.formOpen = this.editing !== -1;
        },
        close: function() {
          this.editing = -1;
          $scope.formOpen = false;
        },
      });
    }

    /*
    function formDirective(options) {
      return form({
        source: options.source,
        save: function(model, form) {
          return form.save();
        }
      });
    }



    function parsePreferredLocations(locations) {
      return Object.keys(locations).map(function(country) {
        var cities = locations[country];
        var text = cities.length ? cities.join(', ') : 'Anywhere';
        return text + ' ' + country;
      }).join(' - ');
    }

    function toCheckboxModel(key) {
      return function(data) {
        $scope[key] = data.map(function(type) {
          return { value: type };
        });
      };
    }

    function onSalaryChange() {
      $scope.errorSalaryTooHigh = $scope.salary.data.salary > 99000000;
    }

    function addLocation(locations, entry) {
      if (!locations[entry.country_iso])
        locations[entry.country_iso] = [ entry.city ];
      else
        locations[entry.country_iso].push(entry.city);
    }
    function updateLocations() {
      var locations = {};
      var add = addLocation.bind(null, locations);
      $scope.errorLocationRequired = false;
      $scope.salary.data.locations = locations;

      $scope.featuredLocations
        .filter(fn.get('selected'))
        .map(fn.get('value'))
        .forEach(add);

      if ($scope.salary.data.germany)
        locations.DE = [];

      if ($scope.salary.data.other) {
        $scope.preferred_locations.forEach(add);
        $scope.errorLocationRequired = !Object.keys(locations).length;
      }
    }
    */
    function toggle(key) {
      $scope[key] = !$scope[key];
    }
  });


  return {
    url: '/profile/',
    template: require('text!./employer-profile.html'),
    controller: 'ProfileCtrl',
    controllerAs: 'profile',
  };
});
