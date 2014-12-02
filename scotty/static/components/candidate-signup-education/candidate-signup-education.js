define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-education/directive-education');
  require('components/directive-education-form/directive-education-form');
  var fn = require('tools/fn');
  var module = require('app-module');


  module.controller('CandidateSignupEducationCtrl', function($scope, $q, toaster, Loader, Session) {
    $scope.listEducation = listEducation;
    $scope.updateImports = updateImports;
    $scope.update = update;
    $scope.add = add;
    $scope.submit = submit;
    $scope.model = {};
    $scope.ready = false;
    var list = [];
    var linkedin = Session.getLinkedIn();
    Loader.page(true);

    Session.getUser().then(function(user) {
      return user.getEducation();
    }).then(function(_list) {
      list = _list;
      if (list.length > 0) {
        list.forEach(function(entry) { entry.import = true; });
        return false;
      }
      return linkedin.checkConnection();
    }).then(function(load) {
      if (load)
        return importLinkedin();
    }).then(function() {
      updateImports(list);
      if (!list.length)
        $scope.list.setAdding(true);
    }).finally(function() {
      $scope.list.refresh();
      Loader.page(false);
      $scope.ready = true;
    });

    function listEducation() {
      return $q.when(list);
    }

    function update(entry, index) {
      entry.import = true;
      list[index] = entry;
      return $q.when(true);
    }

    function add(entry) {
      entry.import = true;
      list.push(entry);
      return $q.when(true);
    }

    function updateImports(list) {
      $scope.someImport = list.some(fn.get('import'));
    }

    function importLinkedin() {
      Loader.add('signup-education-import');

      return linkedin.getEducation().then(function(education) {
        list = education.filter(function(entry) {
          return entry.start && entry.institution;
        }).map(function(entry) {
          entry.imported = true;
          return entry;
        });
        return $scope.list.refresh();
      }).finally(function() {
        Loader.remove('signup-education-import');
      });
    }

    function submit() {
      var data = list.filter(fn.get('import'));
      if (!data.length) {
        toaster.error('No entry selected to add');
        return;
      }

      Loader.add('signup-education-saving');
      Session.getUser().then(function(user) {
        return user.setEducation(data);
      }).then(function() {
        return $scope.signup.nextStep();
      }).finally(function() {
        Loader.remove('signup-education-saving');
      });
    }
  });


  return {
    url: '/education/',
    template: require('text!./candidate-signup-education.html'),
    controller: 'CandidateSignupEducationCtrl',
    controllerAs: 'signupEducation',
  };
});
