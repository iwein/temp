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
    Loader.page(true);


    getStoredEducation().finally(function() {
      $scope.list.refresh();
      Loader.page(false);
      $scope.ready = true;
    });


    function getStoredEducation() {
      return Session.getUser().then(function(user) {
        return user.getEducation();
      }).then(function(stored) {
        if (!stored || !stored.length)
          return Session.getConnectors().getEducation();

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

    function listEducation() {
      return $q.when(list);
    }

    function update(entry, index) {
      entry.import = true;
      list[index] = entry;
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
