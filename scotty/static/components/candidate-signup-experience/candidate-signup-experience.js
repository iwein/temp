define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-experience/directive-experience');
  require('components/directive-experience-form/directive-experience-form');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');


  module.controller('CandidateSignupExperienceCtrl', function($scope, $q, toaster, Loader, Session) {
    $scope.listExperience = listExperience;
    $scope.updateImports = updateImports;
    $scope.update = update;
    $scope.add = add;
    $scope.submit = submit;
    $scope.model = {};
    $scope.ready = false;
    var list = [];
    Loader.page(true);


    getStoredExperience().finally(function() {
      $scope.list.refresh();
      Loader.page(false);
      $scope.ready = true;
    });


    function getStoredExperience() {
      return Session.getUser().then(function(user) {
        return user.getExperience();
      }).then(function(stored) {
        if (!stored || !stored.length)
          return Session.getConnectors().getExperience();

        stored.forEach(fn.set('import', true));
        return stored;
      }).then(function(result) {
        if (result)
          list = result;

        updateImports(list);
        if (!list.length)
          $scope.list.setAdding(true);
      });
    }

    function listExperience() {
      return $q.when(list);
    }

    function update(entry, index) {
      entry.import = true;
      list[index] = entry;
      updateImports(list);
      return $q.when(true);
    }

    function add(entry) {
      entry.import = true;
      list.push(entry);
      updateImports(list);
      return $q.when(true);
    }

    function updateImports(list) {
      $scope.someImport = list.some(fn.get('import'));
    }

    function submit() {
      var data = list.filter(fn.get('import'));
      if (!data.length) {
        toaster.error('No entry selected to add');
        return;
      }

      Loader.add('signup-education-saving');
      Session.getUser().then(function(user) {
        var toSave = data.map(function(entry) {
          var model = _.omit(entry, 'featuredSkills');
          model.skills = [].concat(model.skills || [], entry.featuredSkills || []);
          return model;
        });
        return user.setExperience(toSave);
      }).then(function() {
        return $scope.signup.nextStep();
      }).finally(function() {
        Loader.remove('signup-education-saving');
      });
    }
  });

  return {
    url: '/experience/',
    template: require('text!./candidate-signup-experience.html'),
    controller: 'CandidateSignupExperienceCtrl',
    controllerAs: 'signupExperience',
  };
});
