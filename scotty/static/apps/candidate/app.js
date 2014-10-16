define(function(require) {
  'use strict';
  require('session');
  require('../common/permission');
  var angular = require('angular');
  var module = require('app-module');
  require('../common/basic-conf')(module);

  module.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/dashboard/');

    $stateProvider
      .state('dashboard', require('components/candidate-dashboard/candidate-dashboard'))
      .state('login', require('components/candidate-login/candidate-login'))
      .state('activate', require('components/candidate-activate/candidate-activate'))
      .state('profile', require('components/candidate-profile/candidate-profile'))
      .state('forget-password', require('components/shared-forget-password/shared-forget-password'))
      .state('reset-password', require('components/shared-reset-password/shared-reset-password'))
      .state('search-employers', require('components/candidate-search-employers/candidate-search-employers'))
      .state('employer', require('components/candidate-employer-profile/candidate-employer-profile'))
      .state('offer', require('components/candidate-offer/candidate-offer'))
      .state('signup', require('components/candidate-signup/candidate-signup'))
      .state('signup.target', require('components/candidate-signup-target/candidate-signup-target'))
      .state('signup.user', require('components/candidate-signup-user/candidate-signup-user'))
      .state('signup.experience', require('components/candidate-signup-experience/candidate-signup-experience'))
      .state('signup.skills', require('components/candidate-signup-skills/candidate-signup-skills'))
      .state('signup.education', require('components/candidate-signup-education/candidate-signup-education'))
      .state('signup.languages', require('components/candidate-signup-languages/candidate-signup-languages'))
      .state('signup.profile', require('components/candidate-signup-profile/candidate-signup-profile'))
      .state('signup.activate', require('components/candidate-signup-activate/candidate-signup-activate'))
      ;
  });

  module.run(function($state, $templateCache, $rootScope, Session) {
    $templateCache.put('navbar.html', require('text!./navbar.html'));

    Session.isActivated();
    $rootScope.session = Session;
    $rootScope.logout = function() {
      Session.logout().then(function() {
        $state.go('login');
      });
    };
 });

  angular.bootstrap(document, [ 'scotty-candidate' ]);
});
