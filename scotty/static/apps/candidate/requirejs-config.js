window.DEBUG = true;

requirejs.config({

  baseUrl: '../../',

  paths: {
    // vendors
    'text': 'bower_components/text/text',
    'moment': 'bower_components/moment/moment',
    'angular-core': 'bower_components/angular/angular',
    'angular': 'bower_components/angular-ui-router/release/angular-ui-router',
    'ui.bootstrap': 'bower_components/angular-bootstrap/ui-bootstrap-tpls',

    // aliases
    'conf': 'config/app-conf-dev',
    'app-module': 'apps/candidate/candidate-module',
    'session': 'apps/candidate/session',
  },

  shim: {
    'angular': {
      deps: [ 'angular-core' ],
      exports: 'angular',
    },
    'ui.bootstrap': [ 'angular' ]
  }

})([ 'apps/common/mock-data', 'apps/candidate/app' ]);
