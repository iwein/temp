define(function(require) {
  'use strict';
  require('angular-sanitize');
  require('components/directive-office/directive-office');
  require('components/partial-benefits/partial-benefits');
  var module = require('app-module');


  // jshint maxparams:10
  module.controller('EmployerProfileCtrl', function($scope, $q, $sce, $state, i18n, toaster,
                                                    Lightbox, Loader, Permission, Session) {
    Loader.page(true);
    $scope.slideshow = slideshow;
    $scope.ready = false;


    Permission.requireLogged().then(function() {
      this.toogleBookmark = toogleBookmark;
      $scope.toggle = toggle;
      $scope.id = $state.params.id;

      Loader.add('candidate-employer-profile-isbookmarked');
      Session.getUser().then(function(user) {
        $scope.candidate_has_been_hired = user._data.candidate_has_been_hired;
        $scope.candidate_is_approved = user._data.is_approved;
        $scope.candidate_is_activated = user._data.is_activated;

        $scope.can_act =
          $scope.candidate_is_activated &&
          $scope.candidate_is_approved &&
          !$scope.candidate_has_been_hired;
      }).finally(function() {
        Loader.remove('candidate-employer-profile-isbookmarked');
      });

      Session.getEmployer($scope.id).then(function(employer) {
        $scope.employer = employer;
        return $q.all([
          employer.getPictures().then(function(response) {
            $scope.pictures = response;
          }),
          employer.getData().then(function(data) {
            data.mission_text = $sce.trustAsHtml(data.mission_text);
            data.tech_team_philosophy = $sce.trustAsHtml(data.tech_team_philosophy);
            data.recruitment_process = $sce.trustAsHtml(data.recruitment_process);
            data.training_policy = $sce.trustAsHtml(data.training_policy);
            data.tech_team_office = $sce.trustAsHtml(data.tech_team_office);
            data.working_env = $sce.trustAsHtml(data.working_env);
            data.dev_methodology = $sce.trustAsHtml(data.dev_methodology);
            data.video_script = $sce.trustAsHtml(data.video_script);

            $scope.ready = true;
            $scope.data = data;
            $scope.bookmarked_by_candidate = data.bookmarked_by_candidate;
            $scope.blacklisted_by_candidate = data.blacklisted_by_candidate;
            $scope.accepted_offers_by_candidate = data.accepted_offers_by_candidate;
          }),
        ]);
      }).catch(function() {
        toaster.defaultError();
      }).finally(function() {
        Loader.page(false);
      });

      function toogleBookmark() {
        Loader.add('candidate-employer-profile-toggle');
        return Session.getUser().then(function(user) {

          Session.getEmployer($scope.id).then(function(employer) {
            return employer.isBookmarked ?
              user.deleteBookmark({ id: $scope.id }) :
              user.addBookmark({ id: $scope.id });
          }).then(function() {
            return Session.getEmployer($scope.id);
          }).then(function(employer) {
            $scope.bookmarked_by_candidate = employer.isBookmarked;
            toaster.success(employer.isBookmarked ?
              i18n.gettext('Interview requested') :
              i18n.gettext('Interview request removed'));
          }).catch(function() {
            toaster.defaultError();
          }).finally(function() {
            Loader.remove('candidate-employer-profile-toggle');
          });
        });
      }

      function toggle(key) {
        $scope[key] = !$scope[key];
      }
    }.bind(this));

    function slideshow(index) {
      Lightbox.openModal($scope.pictures, index);
    }
  });


  return {
    url: '/employer/:id',
    template: require('text!./candidate-employer-profile.html'),
    controller: 'EmployerProfileCtrl',
    controllerAs: 'employerProfile'
  };
});
