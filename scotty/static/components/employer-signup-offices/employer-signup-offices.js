define(function(require) {
  'use strict';
  require('components/directive-offices/directive-offices');
  var module = require('app-module');

  // jshint maxparams:7
  module.controller('SignupOfficesCtrl', function($scope, $q, toaster, Loader, ConfigAPI, Session) {
    $scope.listOffices = listOffices;
    $scope.update = update;
    $scope.add = add;
    $scope.submit = submit;
    $scope.model = {};
    $scope.ready = false;
    var list = [];
    Loader.page(true);

    Session.getUser().then(function(user) {
      return user.listOffices();
    }).then(function(_list) {
      list = _list;
      if (!list.length)
        $scope.list.setAdding(true);
    }).finally(function() {
      $scope.list.refresh();
      Loader.page(false);
      $scope.ready = true;
    });

    function listOffices() {
      return $q.when(list);
    }

    function update(entry, index) {
      list[index] = entry;
      return $q.when(true);
    }

    function add(entry) {
      list.push(entry);
      return $q.when(true);
    }

    function submit() {
      if (!list.length) {
        toaster.error('No entry selected to add');
        return;
      }

      Loader.add('signup-offices-saving');
      Session.getUser().then(function(user) {
        return user.setOffices(list);
      }).then(function() {
        return $scope.signup.nextStep();
      }).finally(function() {
        Loader.remove('signup-offices-saving');
      });
    }

    /*
        Session.getUser().then(function(user) {
          return user && user.getData();
        }).then(function(data) {
          $scope.model = _.pick(data, [
            'contact_first_name',
            'contact_last_name',
            'contact_salutation',
          ]);
          $scope.model.contact_email = data.email;

          if (data.address_city)
            $scope.locationText = ConfigAPI.locationToText(data.address_city);
        }).finally(function() {
          $scope.ready = true;
          $scope.loading = false;
        });
    /* */
  });

  return {
    url: '/offices/',
    template: require('text!./employer-signup-offices.html'),
    controller: 'SignupOfficesCtrl',
    controllerAs: 'signupOffices',
  };
});
