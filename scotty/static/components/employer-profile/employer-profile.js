define(function(require) {
  'use strict';
  require('angular-sanitize');
  require('components/directive-office/directive-office');
  require('components/partial-benefits/partial-benefits');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var Date = require('tools/date');
  var module = require('app-module');


  // jshint maxparams:10, maxstatements:50
  module.controller('ProfileCtrl', function($scope, $q, $sce, $state,
    Lightbox, Amazon, Loader, ConfigAPI, Permission, Session) {

    this.edit = function() { $scope.isEditing = true };
    this.stopEdit = function() { $scope.isEditing = false };
    $scope.onCompanyChange = onCompanyChange;
    $scope.searchCompanies = ConfigAPI.companies;
    $scope.searchTags = ConfigAPI.skills;
    $scope.slideshow = slideshow;
    $scope.toggle = toggle;
    $scope.ready = false;
    Loader.page(true);
    var benefits;


    ConfigAPI.benefits().then(function(response) { benefits = response });
    $scope.$watch('company.data.mission_text', function(value) {
      $scope.errorMissionEmpty = !value;
      $scope.missionDirty = $scope.missionDirty || !!value;
    });
    Permission.requireSignup()
      .then(refresh)
      .finally(function() { Loader.page(false) });


    $scope.name = formSimple({
      set: function(data) {
        setData(data);
        return { company_name: data.company_name };
      },
      save: function(model, form, user) {
        return user.updateData(model).catch(function(request) {
          if (request.status === 400)
            $scope.errorCompanyAlreadyRegistered = true;
          throw request;
        });
      }
    });
    $scope.summary = formSimple({
      set: function(data) {
        setData(data);
        return { mission_text: data.mission_text };
      },
      save: function(model, form, user) {
        return user.updateData(model);
      }
    });
    $scope.video = formSimple({
      set: function(data) {
        setData(data);
        return { video_script: data.video_script };
      },
      save: function(model, form, user) {
        return user.updateData(model);
      }
    });
    $scope.tech = formSimple({
      set: function(data) {
        setData(data);
        return _.pick(data, 'tech_team_size', 'tech_tags');
      },
      save: function(model, form, user) {
        return user.updateData(model);
      }
    });
    $scope.descriptions = formSimple({
      set: function(data) {
        setData(data);
        return _.pick(data, 'recruitment_process', 'training_policy',
          'tech_team_office', 'working_env', 'dev_methodology', 'video_script');
      },
      save: function(model, form, user) {
        return user.updateData(model);
      }
    });
    $scope.company = formSimple({
      fields: ['website', 'founding_year', 'revenue_pa', 'funding_amount',
        'no_of_employees', 'cto_blog', 'cto_twitter'],
      set: function(data) {
        setData(data);
        $scope.missionDirty = false;
        return _.pick(data, this.fields);
      },
      save: function(model, form, user) {
        if ($scope.formCompany.$invalid)
          throw new Error('Invalid form');

        this.fields.forEach(function(field) {
          if (!(field in model))
            model[field] = null;
        });
        return user.updateData(model);
      }
    });
    $scope.benefits = formSimple({
      set: function(data) {
        setData(data);
        return {
          other_benefits: data.other_benefits,
          benefits: benefits.map(function(value) {
            return {
              value: value,
              selected: data.benefits.indexOf(value) !== -1
            };
          })
        };
      },
      save: function(model, form, user) {
        return user.updateData({
          other_benefits: model.other_benefits,
          benefits: model.benefits.filter(fn.get('selected')).map(fn.get('value'))
        });
      }
    });
    $scope.webProfiles = formSimple({
      set: function(data) {
        setData(data);
        return _.pick(data, 'fb_url', 'linkedin_url');
      },
      save: function(model, form, user) {
        return user.updateData(model);
      }
    });
    $scope.offices = listForm({
      set: function(data) {
        setData(data);
        return data.offices;
      }
    });
    $scope.picture = _.extend(form({
      source: function(user) {
        return user.getData().then(function(data) {
          setData(data);
          return { logo_url: data.logo_url };
        });
      },
      save: function(model, form, user) {
        return Amazon.upload(model[0], 'logo', Session.id()).then(function(url) {
          return user.updateData({ logo_url: url });
        });
      }
    }), {
      _clean: function(model) {
        return model;
      }
    });
    $scope.pictures = _.extend(form({
      source: function(user) {
        return user.getPictures().then(function(response) {
          this.data = response;
          return response;
        }.bind(this));
      },
      save: function(model, form, user) {
        var pictures = model.filter(fn.not(fn.get('loading')));
        return user.setPictures(pictures);
      }
    }), {
      add: function(fileList) {
        this.uploading = true;
        var data = this.data;
        var files = [].slice.call(fileList);

        return $q.all(files.map(function(file) {
          var id = Date.timestamp() + '-' + Math.round(Math.random() * 1000000);
          var model = {
            url: 'http://www.pagevamp.com/templates/snapsite/newadmin/img/loading.gif',
            description: '',
            loading: true,
          };
          data.push(model);

          return Amazon.upload(file, 'pictures/' + Session.id(), id).then(function(url) {
            model.url = url;
            model.loading = false;
          });
        })).then(function() {
          this.uploading = this.data.some(fn.get('loading'));
        }.bind(this));
      },
      remove: function(index) {
        this.data.splice(index, 1);
      },
    });


    function setData(data) {
      $scope.data = data;
      if (typeof data.video_script === 'string')
        data.video_script = $sce.trustAsHtml(data.video_script);
    }

    function refresh() {
      return Session.getUser().then(function(user) {
        return $q.all([
          $scope.pictures.refresh(),
          user.getData().then(function(data) {
            setData(data);
            $scope.name.set(data);
            $scope.summary.set(data);
            $scope.video.set(data);
            $scope.tech.set(data);
            $scope.descriptions.set(data);
            $scope.company.set(data);
            $scope.benefits.set(data);
            $scope.webProfiles.set(data);
            $scope.offices.set(data);
          }),
        ]);
      }).then(function() {
        $scope.ready = true;
      });
    }

    function form(options) {
      return {
        editing: false,
        fields: options.fields,
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
          this.refresh();
        }
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
        }
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
        }
      });
    }

    function onCompanyChange() {
      $scope.errorCompanyAlreadyRegistered = false;
    }

    function slideshow(index) {
      Lightbox.openModal($scope.pictures.data, index);
    }

    function toggle(key) {
      $scope[key] = !$scope[key];
    }
  });


  return {
    url: '/profile/',
    template: require('text!./employer-profile.html'),
    controller: 'ProfileCtrl',
    controllerAs: 'profile'
  };
});
