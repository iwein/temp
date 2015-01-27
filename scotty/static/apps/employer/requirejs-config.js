window.DEBUG = true;

requirejs.config({

  baseUrl: '../../',

  paths: {
    // vendors
    'text': 'bower_components/text/text',
    'moment': 'bower_components/moment/moment',
    'moment-de': 'bower_components/moment/locale/de',
    'underscore': 'bower_components/underscore/underscore',
    'angular': 'bower_components/angular/angular',
    'angular-router': 'bower_components/angular-ui-router/release/angular-ui-router',
    'angular-animate': 'bower_components/angular-animate/angular-animate',
    'angular-sanitize': 'bower_components/textAngular/dist/textAngular-sanitize.min',
    'angular-gettext': 'bower_components/angular-gettext/dist/angular-gettext',
    'ui.bootstrap': 'bower_components/angular-bootstrap/ui-bootstrap-tpls',
    'textangular': 'bower_components/textAngular/dist/textAngular.min',
    'angulartics': 'bower_components/angulartics/dist/angulartics.min',
    'angulartics-ga': 'tools/angulartics-ga',

    // aliases
    'conf': 'config/config',
    'app-module': 'apps/employer/employer-module',
    'session': 'apps/employer/session',
  },

  shim: {
    'angular': { exports: 'angular' },
    'angulartics': [ 'angular' ],
    'angulartics-ga': [ 'angulartics' ],
    'ui.bootstrap': [ 'angular' ],
    'angular-router': [ 'angular' ],
    'angular-animate': [ 'angular' ],
    'angular-sanitize': [ 'angular' ],
    'angular-gettext': [ 'angular' ],
    'textangular': [ 'angular-sanitize' ],
    'apps/common/translations': [ 'angular-gettext' ],
  }

})([ 'apps/common/mock-data', 'apps/employer/app' ]);
