/*
define(function(require) {
  'use strict';
  require('session');
  var booleanAttrs = require('tools/boolean-attrs');
  var nameAttr = require('tools/name-attr');
  var months = require('tools/months');
  var module = require('app-module');

  module.directive('hcExperienceForm', function() {
    return {
      restrict: 'EA',
      scope: {
        ngModel: '=',
      },
      template: require('text!./directive-experience-form.html'),
      controllerAs: 'educationCtrl',
      controller: function($scope, $attrs, ConfigAPI) {
        booleanAttrs($scope, $attrs, [ 'hcShowEmpty' ]);
        nameAttr(this, 'hcExperienceForm', $scope, $attrs);
        $scope.searchInstitutions = ConfigAPI.institutions;
        $scope.searchCourses = ConfigAPI.courses;
        $scope.searchDegrees = ConfigAPI.degrees;
        $scope.months = months;
        this.refresh = list;

        function edit(entry) {
          remove(entry).then(function() {
            $scope.onEdit({ $entry: entry });
          });
        }

        function remove(entry) {
          return $scope.hcSourceRemove({ $entry: entry }).then(function() {
            list();
            $scope.onRemove(entry.id);
          });
        }

        function list() {
          $scope.error = false;
          return $scope.hcSource().then(function(data) {
            $scope.model = data;
            self.length = data.length;
          }).catch(function() {
            $scope.error = true;
          });
        }
      },
    };
  });
});


define(function(require) {
  'use strict';
  require('tools/config-api');
  var fn = require('tools/fn');
  var module = require('app-module');

  module.controller('CandidateSignupExperienceCtrl', function($scope, $q, $state, toaster, ConfigAPI, Session) {
    this.searchCompanies = ConfigAPI.companies;
    this.searchSkills = ConfigAPI.skills;
    this.searchRoles = ConfigAPI.roles;
    this.nextStep = nextStep;
    this.edit = edit;
    this.submit = submit;
    $scope.months = months;
    $scope.model = {};
    $scope.loading = false;

    $scope.ready = false;
    Session.getUser().finally(function() {
      $scope.ready = true;
    });

    ConfigAPI.countries({ limit: 500 }).then(fn.setTo('countries', $scope));
    bindDate('start');
    bindDate('end');

    function nextStep(event) {
      event.preventDefault();
      $scope.loading = true;
      $scope.signup.nextStep().finally(function() {
        $scope.loading = false;
      });
    }

    function edit(entry) {
      $scope.model = entry;
      var start = new Date(entry.start);
      $scope.startMonth = months[start.getMonth()];
      $scope.startYear = start.getFullYear();

      if (entry.end) {
        var end = new Date(entry.end);
        $scope.endMonth = months[end.getMonth()];
        $scope.endYear = start.getFullYear();
      } else {
        $scope.current = true;
      }
    }

    function save() {
      if (!$scope.model.skills.length) {
        $scope.formExperience.skill.$dirty = true;
        $scope.currentSkill = '';
        return $q.reject(new Error('Form data not valid'));
      }

      if ($scope.current)
        $scope.model.end = null;

      $scope.loading = true;
      return Session.user.addExperience($scope.model).catch(function(error) {
        toaster.defaultError();
        throw error;
      });
    }

    function addAnother() {
      return save().then(function() {
        return $scope.list.refresh();
      }).then(function() {
        $scope.formExperience.$setPristine();
        $scope.skills.setDirty(false);
        $scope.startMonth = '';
        $scope.startYear = '';
        $scope.endMonth = '';
        $scope.endYear = '';
        $scope.model = {};
      });
    }

    function saveAndContinue() {
      return save().then(function() {
        return $scope.signup.nextStep();
      });
    }

    function submit() {
      ( $scope.addAnother ?
        addAnother() :
        saveAndContinue()
      ).finally(function() {
        $scope.loading = false;
      });
    }

    function bindDate(key) {
      var month = key + 'Month';
      var year = key + 'Year';
      var storedValue = $scope.model[key];

      if (storedValue) {
        var date = new Date(storedValue);
        $scope[year] = date.getFullYear();
        $scope[month] = months[date.getMonth()];
      }

      $scope[key + 'DateUpdate'] = function() {
        var value = null;

        if ($scope[month] && $scope[year]) {
          var date = new Date($scope[year], months.indexOf($scope[month]));
          value = date.getFullYear() + '-' + (date.getMonth() + 1) + '-01';
        }

        $scope.model[key] = value;
      };
    }
  });

  return {
    url: '/experience/',
    template: require('text!./candidate-signup-experience.html'),
    controller: 'CandidateSignupExperienceCtrl',
    controllerAs: 'signupExperience',
  };
});
*/
