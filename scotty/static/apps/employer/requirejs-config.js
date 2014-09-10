window.DEBUG = true;

requirejs.config({

  baseUrl: '../../',

  paths: {
    // vendors
    'text': 'bower_components/text/text',
    'moment': 'bower_components/moment/moment',
    'angular-core': 'bower_components/angular/angular',
    'angular': 'bower_components/angular-ui-router/release/angular-ui-router',
    'angular-sanitize': 'bower_components/textAngular/dist/textAngular-sanitize.min',
    'textangular': 'bower_components/textAngular/dist/textAngular.min',
    'ui.bootstrap': 'bower_components/angular-bootstrap/ui-bootstrap-tpls',

    // aliases
    'conf': 'config/app-conf-dev',
    'app-module': 'apps/employer/employer-module',
    'session': 'apps/employer/session',
  },

  shim: {
    'angular-sanitize': [ 'angular-core' ],
    'ui.bootstrap': [ 'angular-core' ],
    'textangular': [ 'angular-sanitize' ],
    'angular': {
      deps: [ 'angular-core' ],
      exports: 'angular',
    },
  }

})([ 'apps/common/mock-data', 'apps/employer/app' ]);
