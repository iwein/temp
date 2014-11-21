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
  var fn = require('tools/fn');
  var module = require('app-module');

  // jshint maxstatements:40
  module.controller('ProfileCtrl', function($scope, $q, $state, Amazon, Loader, ConfigAPI, Permission, Session) {
    this.edit = function() { $scope.isEditing = true };
    this.stopEdit = function() { $scope.isEditing = false };
    $scope.locationToText = ConfigAPI.locationToText;
    $scope.searchCities = ConfigAPI.locations;
    $scope.onSalaryChange = onSalaryChange;
    $scope.updateLocations = updateLocations;
    $scope.isEditing = false;
    $scope.starValues = [ null, 'basic', 'advanced', 'expert' ];
    Loader.page(true);


    ConfigAPI.featuredLocations()
      .then(toCheckboxModel('featuredLocations'));
    ConfigAPI.featuredRoles()
      .then(fn.setTo('featuredRoles', $scope));
    ConfigAPI.countries({ limit: 500 })
      .then(fn.setTo('countries', $scope));

    Permission.requireActivated()
      .then(refresh)
      .finally(function() { Loader.page(false) });


    $scope.contact = form({
      source: function(user) {
        return user.getData().then(function(data) {
          return _.pick(data, 'contact_line1', 'contact_line2', 'contact_phone',
            'contact_skype', 'contact_zipcode', 'email', 'github_url',
            'location', 'pob', 'stackoverflow_url');
        });
      },
      save: function(model, form, user) {
        return user.updateData(model);
      }
    });
    $scope.salary = form({
      source: function(user) {
        return $q.all([
          user.getData(),
          user.getTargetPosition(),
        ]).then(function(result) {
          $scope.user = result[0];
          $scope.targetPosition.data = result[1];
          $scope.preferredLocations = parsePreferredLocations(result[0].preferred_location);
          return {
            locations: result[0].preferred_location,
            salary: result[1].minimum_salary
          };
        });
      },
      save: function(model, form, user) {
        $scope.targetPosition.data.minimum_salary = model.salary;
        return $q.all([
          user.setPreferredLocations(model.locations),
          user.setTargetPosition($scope.targetPosition.data),
        ]);
      },
      edit: function(data) {
        $scope.salary.data.germany = false;
        $scope.salary.data.other = false;

        var locations = JSON.parse(JSON.stringify(data.locations));
        if (locations.DE && !locations.DE.length) {
          $scope.salary.data.germany = true;
          return;
        }

        $scope.featuredLocations.forEach(function(entry) {
          var country = entry.value.country_iso;
          var city = entry.value.city;
          var index = (locations[country] || []).indexOf(city);
          entry.selected = index !== -1;
          if (entry.selected)
            locations[country].splice(index, 1);
        });

        var cities = Object.keys(locations).reduce(function(sum, country) {
          return sum.concat(locations[country].map(function(city) {
            return {
              city: city,
              country_iso: country,
            };
          }));
        }, []);

        $scope.salary.data.other = !!cities.length;
        $scope.preferred_locations = cities;
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
            dob: new Date(data.dob),
            eu_work_visa: data.eu_work_visa,
          };
        });
      },
      save: function(model, form, user) {
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
    $scope.picture = form({
      source: function(user) {
        return user.getData().then(function(data) {
          $scope.user = data;
          return data.picture_url;
        });
      },
      save: function(model, form, user) {
        return Amazon.upload(model[0], 'users', Session.id()).then(function(url) {
          return user.setPhoto(url + '?nocache=' + Date.now());
        });
      },
    });
    $scope.skills = formDirective({
      source: function(user) {
        return user.getData().then(function(data) {
          $scope.user = data;
          return data.skills;
        });
      },
    });
    $scope.languages = formDirective({
      source: function(user) {
        return user.getData().then(function(data) {
          $scope.user = data;
          return data.languages;
        });
      },
    });
    var experience = $scope.experience = listForm({
      source: function(user) {
        return user.getExperience().then(function(list) {
          var total = 0;
          var timeline = list.map(function(entry) {
            var start = new Date(entry.start);
            var end = entry.end ? new Date(entry.end) : new Date();
            var duration = end - start;
            total += duration;
            return {
              start: start,
              duration: duration,
              role: entry.role,
            };
          });
          timeline.forEach(function(entry) {
            entry.percent = (100 - 2) / total * entry.duration;
          });
          $scope.timeline = timeline.sort(function(a, b) {
            return a.start - b.start;
          });
          return list;
        });
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
          user.getOffers(),
          experience.refresh(),
          education.refresh(),
        ]);
      }).then(function(data) {
        var user = data[0];
        $scope.offers = data[2].slice(3);
        $scope.targetPosition.data = data[1];
        $scope.skills.data = user.skills;
        $scope.languages.data = user.languages;
        $scope.picture.data = user.picture_url;
        $scope.summary.data = user.summary;
        $scope.user = user;
        $scope.preferredLocations = parsePreferredLocations(user.preferred_location);
        $scope.contact.data = _.pick(user, 'contact_line1', 'contact_line2', 'contact_phone',
          'contact_skype', 'contact_zipcode', 'email', 'github_url',
          'location', 'pob', 'stackoverflow_url');
        $scope.salary.data = {
          locations: user.preferred_location,
          salary: data[1].minimum_salary
        };
        $scope.dob.data = {
          dob: new Date(user.dob),
          eu_work_visa: user.eu_work_visa,
        };
        $scope.ready = true;

        var finalStatus = [ 'REJECTED', 'WITHDRAWN' ];
        $scope.status = $scope.offers.reduce(function(summary, value) {
          if (finalStatus.indexOf(value.status) !== -1) return;
          if (value.status === 'CONTRACT_SIGNED') return 'hired';
          return summary || 'reviewing';
        }, null) || 'searching';
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
        },
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
  });


  return {
    url: '/profile/',
    template: require('text!./candidate-profile.html'),
    controller: 'ProfileCtrl',
    controllerAs: 'profile',
  };
});
