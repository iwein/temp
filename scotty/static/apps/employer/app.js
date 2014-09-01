define(function(require) {
  'use strict';
  require('components/MODULE_NAME/MODULE_NAME');
  var module = require('app-module')

  module.config(function($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'components/MODULE_NAME/MODULE_NAME.html',
        controller: 'MODULE_NAMECtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });

  angular.bootstrap(document, [ 'scotty-employer' ]);
});
