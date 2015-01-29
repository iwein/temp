define(function(require) {
  'use strict';
  require('tools/config-api');
  require('components/directive-experience-form/directive-experience-form');
  var _ = require('underscore');
  var fn = require('tools/fn');
  var module = require('app-module');


  module.controller('CandidateSignupExperienceCtrl', function($scope, $q, gettext, toaster, Loader, Session) {
    _.extend($scope, {
      onImportChange: updateImports,
      setEditing: setEditing,
      isEditing: isEditing,
      setAdding: setAdding,
      isAdding: isAdding,
      submit: submit,
      save: save,
      add: add,
    });


    var editing = [];
    return onLoad();


    function isAdding() {
      return isEditing('new');
    }

    function setAdding(value) {
      return setEditing('new', value);
    }

    /*
     * isEditing() returns if any entry is being edited
     * isEditing('new') returns if 'add' form is being edited
     * isEditing(<number>) returns if the entry at <number> index is being edited
     */
    function isEditing(index) {
      if (index == null)
        return !!editing.length;

      return editing.indexOf(index) !== -1;
    }

    function setEditing(index, value) {
      editing = editing.filter(fn.not(fn.equal(index)));

      if (value)
        editing.push(index);
    }

    function updateImports() {
      $scope.isSomeImported = $scope.list.some(fn.get('import'));
    }

    function add(model, form, index) {
      setEditing('new', false);
      save(model, form, index);
    }

    function save(model, form, index) {
      setEditing(index, false);
      model.import = true;
      $scope.list[index] = model;
      updateImports();
    }

    function submit() {
      var data = $scope.list
        .filter(fn.get('import'))
        .map(function(entry) {
          var model = _.omit(entry, 'featuredSkills');
          model.skills = [].concat(model.skills || [], entry.featuredSkills || []);
          return model;
        });

      if (!data.length) {
        toaster.error(gettext('Please select at least one row to add.'));
        return;
      }

      Loader.add('signup-experience-saving');
      Session.getUser()
        .then(function(user) { return user.setExperience(data) })
        .then(function() { return $scope.signup.nextStep() })
        .finally(function() { Loader.remove('signup-experience-saving') });
    }

    function onLoad() {
      $scope.ready = false;
      Loader.page(true);

      return getStoredExperience().finally(function() {
        Loader.page(false);
        $scope.ready = true;
      });
    }

    function getStoredExperience() {
      return Session.getUser().then(function(user) {
        return user.getExperience();
      }).then(function(stored) {
        if (!stored || !stored.length)
          return Session.getConnectors().getExperience();

        stored.forEach(fn.set('import', true));
        return stored;
      }).then(function(result) {
        $scope.list = result || [];
        updateImports();

        if (!$scope.list.length)
          setAdding(true);
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
