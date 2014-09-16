window.DEBUG = true;

requirejs.config({

  baseUrl: '../../',

  paths: {
    // vendors
    'text': 'bower_components/text/text',
    'moment': 'bower_components/moment/moment',
    'angular': 'bower_components/angular/angular',
    'angular-router': 'bower_components/angular-ui-router/release/angular-ui-router',
    'angular-animate': 'bower_components/angular-animate/angular-animate',
    'angularjs-toaster': 'bower_components/angularjs-toaster/toaster',
    'ui.bootstrap': 'bower_components/angular-bootstrap/ui-bootstrap-tpls',

    // aliases
    'conf': 'config/app-conf-dev',
    'app-module': 'apps/admin/admin-module',
    'session': 'apps/admin/session',
  },

  shim: {
    'angular': { exports: 'angular' },
    'ui.bootstrap': [ 'angular' ],
    'angular-router': [ 'angular' ],
    'angular-animate': [ 'angular' ],
    'angularjs-toaster': [ 'angular-animate' ],
  }

})([ 'apps/common/mock-data', 'apps/admin/app' ]);
