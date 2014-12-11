window.DEBUG = true;

requirejs.config({

  baseUrl: '../',

  paths: {
    // vendors
    'text': 'bower_components/text/text',
    'underscore': 'bower_components/underscore/underscore',
    'moment': 'bower_components/moment/moment',
    'angular': 'bower_components/angular/angular',
    'angular-router': 'bower_components/angular-ui-router/release/angular-ui-router',
    'angular-sanitize': 'bower_components/textAngular/dist/textAngular-sanitize.min',
    'angular-animate': 'bower_components/angular-animate/angular-animate',
    'ui.bootstrap': 'bower_components/angular-bootstrap/ui-bootstrap-tpls',

    // aliases
    'conf': 'config/config',
    'app-module': 'apps/index/index-module',
  },

  shim: {
    'angular': { exports: 'angular' },
    'ui.bootstrap': [ 'angular' ],
    'angular-router': [ 'angular' ],
    'angular-animate': [ 'angular' ],
    'angular-sanitize': [ 'angular' ],
  }

})([ 'apps/index/app' ]);
