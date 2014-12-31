define(function(require) {
  'use strict';
  require('angular-sanitize');
  require('components/directive-office/directive-office');
  var module = require('app-module');

  module.controller('EmployerProfileCtrl', function($scope, $sce, $state, toaster, Loader, Session) {
    $scope.saveAdminComment = saveAdminComment;
    $scope.remove = remove;
    $scope.ready = false;
    $scope.id = $state.params.id;
    Loader.page(true);

    Session.getEmployer($scope.id).then(function(employer) {
      $scope.employer = employer;
      return employer.getData();
    }).then(function(data) {
      $scope.ready = true;
      $scope.data = data;
      $scope.data.mission_text = $sce.trustAsHtml(data.mission_text);
    }).catch(function() {
      toaster.defaultError();
    }).finally(function() {
      Loader.page(false);
    });

    function saveAdminComment(comment) {
      Loader.add('admin-employer-profile-comment');
      return $scope.employer.updateData({ admin_comment: comment })
        .catch(toaster.defaultError)
        .finally(function() { Loader.remove('admin-employer-profile-comment') });
    }

    function remove(employer) {
      Loader.add('admin-employer-profile-remove');

      return employer.delete()
        .then(function(response) {
          if (response.status !== 'success')
            throw new Error('Employer was no deleted');

          $state.go('search-employers');
          toaster.success('Employer deleted');
        })
        .catch(toaster.defaultError)
        .finally(function() {
          Loader.remove('admin-employer-profile-remove');
        });
    }

  });


  return {
    url: '/employer/:id',
    template: require('text!./admin-employer-profile.html'),
    controller: 'EmployerProfileCtrl',
    controllerAs: 'employerProfile',
  };
});
