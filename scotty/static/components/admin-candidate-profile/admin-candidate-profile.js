define(function(require) {
  'use strict';
  var fn = require('tools/fn');
  var module = require('app-module');

  module.controller('CandidateProfileCtrl', function($scope, $q, $state, toaster, Loader, Session) {
    $scope.saveAdminComment = saveAdminComment;
    $scope.searchCompanies = searchCompanies;
    $scope.renderSuggestion = renderSuggestion;
    $scope.recommendTo = recommendTo;
    $scope.removeRecommendation = removeRecommendation;
    $scope.sendEmail = sendEmail;
    $scope.remove = remove;
    $scope.approve = approve;
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
          candidate.getTargetPosition().then(fn.setTo('targetPosition', $scope)),
          candidate.getHighestDegree().then(fn.setTo('highestDegree', $scope)),
          candidate.getExperience().then(fn.setTo('workExperience', $scope)),
          candidate.getEducation().then(fn.setTo('education', $scope)),
        ]);
      }).then(function(data) {
        var user = data[0];
        $scope.cities = user.preferred_location;
        $scope.languages = user.languages;
        $scope.skills = user.skills;
        $scope.user = user;
        $scope.ready = true;

        return Session.getCandidateSuggestions(user);
      }).then(function(response) {
        $scope.suggestions = response.data;
      }).catch(function() {
        toaster.defaultError();
      }).finally(function() {
        Loader.page(false);
      });
    }

    function approve(candidate) {
      Loader.add('admin-approve-candidates-approve');
      return Session.approveCandidate(candidate).then(function() {
        refresh();
      }).finally(function() {
        Loader.remove('admin-approve-candidates-approve');
      });
    }

    function recommendTo(suggestion) {
      return Session.recommendCandiate($scope.user, suggestion.employer);
    }

    function removeRecommendation(suggestion, index) {
      return Session.removeRecommendation($scope.user, suggestion.employer).then(function() {
        $scope.suggestions.splice(index, 1);
      });
    }

    function sendEmail(suggestion) {
      return Session.sendRecommendationEmail($scope.user, suggestion.employer).then(function() {
        toaster.success('Email sent');
      }, toaster.defaultError);
    }

    function searchCompanies(term) {
      return Session.searchEmployers({
        fields: 'id,company_name',
        // status: 'APPROVED',
        limit: 20,
        q: term,
      }).then(function(response) {
        return response.data.map(function(employer) {
          return { employer: employer };
        });
      });
    }

    function renderSuggestion(suggestion) {
      return suggestion.employer.company_name;
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
