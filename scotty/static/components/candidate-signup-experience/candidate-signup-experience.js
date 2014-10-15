define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-experience/directive-experience');
  require('components/directive-experience-form/directive-experience-form');
  var _ = require('underscore');
  var module = require('app-module');


  module.controller('CandidateSignupExperienceCtrl', function($scope, $q, Loader, Session) {
    $scope.listExperience = listExperience;
    $scope.update = update;
    $scope.add = add;
    $scope.submit = submit;
    $scope.model = {};
    $scope.ready = false;
    var list = [];
    var linkedin = Session.getLinkedIn();
    Loader.page(true);

    Session.getUser().then(function(user) {
      return user.getExperience();
    }).then(function(_list) {
      list = _list;
      if (list.length > 0)
        return false;
      return linkedin.checkConnection();
    }).then(function(load) {
      if (load)
        return importLinkedin();
    }).then(function() {
      if (!list.length)
        $scope.list.add();
    }).finally(function() {
      $scope.list.refresh();
      Loader.page(false);
      $scope.ready = true;
    });

    function listExperience() {
      return $q.when(list);
    }

    function update(entry, index) {
      entry.import = true;
      list[index] = entry;
      return $q.when(true);
    }

    function add(entry) {
      list.push(entry);
      return $q.when(true);
    }

    function importLinkedin() {
      Loader.add('signup-experience-import');

      return linkedin.getExperience().then(function(experience) {
        list = experience.map(function(entry) {
          entry.imported = true;
          entry.import = true;
          return entry;
        });
        return $scope.list.refresh();
      }).finally(function() {
        Loader.remove('signup-experience-import');
      });
    }

    function submit() {
      // TODO
      Loader.add('signup-education-saving');

      Session.getUser().then(function(user) {
        return $q.all(list.map(function(entry) {
          var model = _.omit(entry, 'featuredSkills');
          model.skills = [].concat(model.skills || [], entry.featuredSkills || []);

          if (!model.summary)
            model.summary = 'ASDF';

          if (model.import)
            return user.addExperience(model);
        }));
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
