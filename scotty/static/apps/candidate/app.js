define(function(require) {
  'use strict';
  require('session');
  require('../common/permission');
  var angular = require('angular');
  var _ = require('underscore');
  var profileState = require('components/candidate-profile/candidate-profile');
  var conf = require('conf');
  var module = require('app-module');
  require('../common/basic-conf')(module);

  module.config(function($stateProvider, $urlRouterProvider, $analyticsProvider) {
    if (window.ga) {
      window.ga('create', conf.ga_id, 'auto');
      window.ga('require', 'linkid');
      window.ga('require', 'displayfeatures');
      window.ga('send', 'pageview');
      window.ga('set', 'anonymizeIp', true);

      var ga = $analyticsProvider.settings.ga;
      ga.additionalAccountNames = ga.additionalAccountNames || [];
      angular.forEach(conf.additional_accounts, function (account) {
        window.ga('create', account.ga_id, 'auto', {'name': account.name});
        ga.additionalAccountNames.push(account.name);
      });
    }

    $urlRouterProvider.otherwise('/dashboard/');

    $stateProvider
      .state('dashboard', require('components/candidate-dashboard/candidate-dashboard'))
      .state('signup-complete', _.extend({}, profileState, { url: '/signup-complete/' }))
      .state('profile', profileState)
      .state('activate', require('components/candidate-activate/candidate-activate'))
      .state('reset-password', require('components/shared-reset-password/shared-reset-password'))
      .state('employer', require('components/candidate-employer-profile/candidate-employer-profile'))
      .state('offer-list', require('components/candidate-offer-list/candidate-offer-list'))
      .state('offer', require('components/candidate-offer/candidate-offer'))
      .state('signup', require('components/candidate-signup/candidate-signup'))
    ;
  });

  module.run(function($window, $templateCache, $rootScope, Session) {
    $templateCache.put('navbar.html', require('text!./navbar.html'));

    Session.getUser();
    $rootScope.session = Session;
    $rootScope.logout = function() {
      Session.logout().then(function() {
        $window.location = '/';
      });
    };
  });

  angular.bootstrap(document, [ 'scotty-candidate' ]);

  require('components/partial-candidate-email-confirm-msg/partial-candidate-email-confirm-msg');
});
