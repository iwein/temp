define(function(require) {
  'use strict';
  require('session');
  require('../common/permission');
  var angular = require('angular');
  var _ = require('underscore');
  var dashboardState = require('components/employer-dashboard/employer-dashboard');
  var module = require('app-module');
  var conf = require('conf');
  require('../common/basic-conf')(module);

  module.config(function($stateProvider, $urlRouterProvider, $analyticsProvider, ngClipProvider) {
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

    ngClipProvider.setPath('/employer/resources/ZeroClipboard.swf');
    $urlRouterProvider.otherwise('/dashboard/');

    $stateProvider
      .state('dashboard', dashboardState)
      .state('signup-complete', _.extend({}, dashboardState, { url: '/signup-complete/' }))
      .state('profile', require('components/employer-profile/employer-profile'))
      .state('reset-password', require('components/shared-reset-password/shared-reset-password'))

      .state('candidate', require('components/employer-candidate-profile/employer-candidate-profile'))
      .state('create-offer', require('components/employer-create-offer/employer-create-offer'))
      .state('offer', require('components/employer-offer/employer-offer'))
      .state('offer-list', require('components/employer-offer-list/employer-offer-list'))

      .state('signup', require('components/employer-signup/employer-signup'))
      .state('signup.start', require('components/employer-signup-start/employer-signup-start'))
      .state('signup.basic', require('components/employer-signup-basic/employer-signup-basic'))
      .state('signup.offices', require('components/employer-signup-offices/employer-signup-offices'))
      .state('signup.mission', require('components/employer-signup-mission/employer-signup-mission'))
      .state('signup.facts', require('components/employer-signup-facts/employer-signup-facts'))
      .state('signup.benefits', require('components/employer-signup-benefits/employer-signup-benefits'))
      .state('signup.terms', require('components/employer-signup-terms/employer-signup-terms'))
      .state('signup.suggest', require('components/employer-signup-suggest/employer-signup-suggest'))
      ;
  });

  module.run(function($window, $location, $templateCache, $rootScope, $analytics, Session) {
    var location = $window.location.pathname;
    var basePath = location.substr(0, location.length - $location.url().length);
    $analytics.settings.pageTracking.basePath = basePath;
    $templateCache.put('navbar.html', require('text!./navbar.html'));

    $rootScope.session = Session;
    $rootScope.logout = function() {
      Session.logout().then(function() {
        $window.location = '/';
      });
    };

    $rootScope.$on('$stateChangeSuccess', function(event, state) {
      $rootScope.currentState = state;
    });
  });

  angular.bootstrap(document, [ 'scotty-employer' ]);
});
