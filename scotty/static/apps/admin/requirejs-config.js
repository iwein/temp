window.DEBUG = true;

requirejs.config({

  baseUrl: '../../',

  paths: {
    // vendors
    'text': 'bower_components/text/text',
    'underscore': 'bower_components/underscore/underscore',
    'moment': 'bower_components/moment/moment',
    'angular': 'bower_components/angular/angular',
    'angular-router': 'bower_components/angular-ui-router/release/angular-ui-router',
    'angular-sanitize': 'bower_components/textAngular/dist/textAngular-sanitize.min',
    'angular-animate': 'bower_components/angular-animate/angular-animate',
    'angular-gettext': 'bower_components/angular-gettext/dist/angular-gettext',
    'ui.bootstrap': 'bower_components/angular-bootstrap/ui-bootstrap-tpls',

    // aliases
    'conf': 'config/config',
    'app-module': 'apps/admin/admin-module',
    'session': 'apps/admin/session',
  },

  shim: {
    'angular': { exports: 'angular' },
    'ui.bootstrap': [ 'angular' ],
    'angular-router': [ 'angular' ],
    'angular-animate': [ 'angular' ],
    'angular-sanitize': [ 'angular' ],
    'angular-gettext': [ 'angular' ],
    'apps/common/translations': [ 'angular-gettext' ],
  }

})([ 'apps/common/mock-data', 'apps/admin/app' ]);
