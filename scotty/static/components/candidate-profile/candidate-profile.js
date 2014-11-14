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

  module.controller('ProfileCtrl', function($scope, $q, $state, Amazon, Loader, ConfigAPI, Permission, Session) {
    this.edit = function() { $scope.isEditing = true };
    this.stopEdit = function() { $scope.isEditing = false };
    $scope.locationToText = ConfigAPI.locationToText;
    $scope.searchCities = ConfigAPI.locations;
    $scope.onSalaryChange = onSalaryChange;
    $scope.updateLocations = updateLocations;
    $scope.isEditing = true;
    $scope.starValues = [ null, 'basic', 'advanced', 'expert' ];
    Loader.page(true);


    ConfigAPI.featuredLocations()
      .then(toCheckboxModel('featuredLocations'));

    Permission.requireActivated()
      .then(refresh)
      .finally(function() { Loader.page(false) });


    $scope.salary = form({
      source: function(user) {
        return $q.all([
          user.getData(),
          user.getTargetPosition(),
        ]).then(function(result) {
          $scope.user = result[0];
          $scope.targetPosition = result[1];
          $scope.preferredLocations = parsePreferredLocations(result[0].preferred_location);
          return {
            locations: result[0].preferred_location,
            salary: result[1].minimum_salary
          };
        });
      },
      save: function(model) {
        return Session.getUser().then(function(user) {
          $scope.targetPosition.minimum_salary = model.salary;
          return $q.all([
            user.setPreferredLocations(model.locations),
            user.setTargetPosition($scope.targetPosition),
          ]);
        });
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
      save: function(model) {
        return Session.getUser().then(function(user) {
          return user.updateData(model);
        });
      }
    });
    $scope.availability = form({
      source: function(user) {
        return user.getData().then(function(data) {
          $scope.user = data;
          return data.availability;
        });
      },
      save: function(model) {
        return Session.getUser().then(function(user) {
          return user.updateData({ availability: model });
        });
      }
    });
    $scope.picture = form({
      source: function(user) {
        return user.getData().then(function(data) {
          $scope.user = data;
          return data.picture_url;
        });
      },
      save: function(model) {
        return Amazon.upload(model, 'users', Session.id()).then(function(url) {
          return Session.getUser().then(function(user) {
            user.setPhoto(url);
          });
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
        $scope.picture.data = user.picture_url;
        $scope.user = user;
        $scope.preferredLocations = parsePreferredLocations(user.preferred_location);
        $scope.salary.data = {
          locations: user.preferred_location,
          salary: data[1].minimum_salary
        };
        $scope.dob.data = {
          dob: new Date(user.dob),
          eu_work_visa: user.eu_work_visa,
        };
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
          return options.save(model, form)
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
