define(function(require) {
  'use strict';
  require('components/directive-experience/directive-experience');
  require('components/directive-education/directive-education');
  var module = require('app-module');

  module.controller('CandidateProfileCtrl', function($scope, $q, $state, toaster, Loader, Session) {
    $scope.saveAdminComment = saveAdminComment;
    $scope.remove = remove;
    $scope.id = $state.params.id;
    $scope.ready = false;
    Loader.page(true);

    $scope.wakeCandidate = function(candidate){
      Session.wakeCandidate(candidate).then(function(){
        refresh();
      });
    };
    refresh();


    function refresh(){
      Session.getCandidate($scope.id).then(function(candidate) {
        $scope.candidate = candidate;
        return $q.all([
          candidate.getData(),
          candidate.getTargetPosition(),
        ]);
      }).then(function(data) {
        var user = data[0];
        $scope.targetPosition = data[1];
        $scope.cities = user.preferred_location;
        $scope.languages = user.languages;
        $scope.skills = user.skills;
        $scope.user = user;
        $scope.ready = true;
      }).catch(function() {
        toaster.defaultError();
      }).finally(function() {
        Loader.page(false);
      });
    }



    function saveAdminComment(comment) {
      Loader.add('admin-candidate-profile-comment');
      return $scope.candidate.updateData({ admin_comment: comment })
        .catch(toaster.defaultError)
        .finally(function() { Loader.remove('admin-candidate-profile-comment') });
    }

    function remove(candidate) {
      Loader.add('admin-candidate-profile-remove');

      return candidate.delete()
        .then(function(response) {
          if (response.status !== 'success')
            throw new Error('Candidate was no removed');

          $state.go('search-candidates');
          toaster.success('Candidate removed');
        })
        .catch(toaster.defaultError)
        .finally(function() {
          Loader.remove('admin-candidate-profile-remove');
        });
    }
  });


  return {
    url: '/candidate/:id',
    template: require('text!./admin-candidate-profile.html'),
    controller: 'CandidateProfileCtrl',
    controllerAs: 'candidateProfile'
  };
});
